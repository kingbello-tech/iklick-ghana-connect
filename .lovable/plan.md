# Payroll & Payslips (Ghana-compliant)

A new internal-only module under `/crm/hr/...` that lets HR/Finance manage employee pay records, run monthly payroll with automatic GRA PAYE, SSNIT Tier 1 and Tier 2 calculations, generate per-employee PDF payslips, file statutory schedules, and lets every staff member view their own payslip history.

## What gets built

### 1. New role & access
- Add `hr_officer` to the `app_role` enum.
- Helper function `has_hr_access(uid)` → admin | finance_officer | hr_officer.
- Sidebar "HR & Payroll" group visible only to those roles, plus a "My Payslips" link visible to every signed-in staff member.

### 2. Employee payroll profiles
Page: `/crm/hr/employees`
- One row per staff member (linked to `auth.users` / `profiles`).
- Fields: SSNIT number, TIN, Ghana Card #, bank name + account, mobile money #, hire date, employment type (permanent / contract / probation), job title, department, basic salary (GHS), pay frequency (monthly), tier-2 trustee, status (active / on-leave / terminated), termination date.
- Recurring pay-item assignments (links to catalog items with default amount or % of basic).

### 3. Pay items catalog + per-payslip overrides
Page: `/crm/hr/pay-items`
- Reusable items finance/HR can edit at any time.
- Per item: name, type (allowance / deduction / employer-cost), taxable (yes/no), pension-qualifying (yes/no — affects SSNIT base), calculation (`fixed` or `percent_of_basic`), default value, active.
- Seed: Transport Allowance, Rent Allowance, Risk Allowance, Overtime, Bonus, Salary Advance Recovery, Loan Repayment, Tier 3 Voluntary, Welfare Dues.
- On any payslip, HR can also add one-off lines (bonus, advance, etc.) without touching the catalog.

### 4. Statutory configuration
Page: `/crm/hr/statutory-settings` (admin-only)
- **PAYE bands** table (band order, monthly threshold GHS, rate %). Effective-from date so historical runs stay correct. Seeded with current GRA monthly resident bands.
- **SSNIT** rates (employee 5.5%, employer 13%, total 18.5%) — editable.
- **Tier 2** rate (5%) — editable.
- All statutory calc reads the bands/rates that were active at the run's pay period.

### 5. Payroll runs
Page: `/crm/hr/payroll-runs`
- Create a run for a given month → choose which employees to include (default: all active).
- For each employee, system computes:
  - Gross = basic + sum(allowances)
  - Pension-qualifying gross (basic + qualifying allowances)
  - SSNIT employee 5.5%, employer 13%, Tier 2 employer 5%
  - Taxable income = gross − employee SSNIT 5.5% − non-taxable allowances
  - PAYE via cumulative band lookup
  - Other deductions (loans, advances, voluntary)
  - Net pay
- Run statuses: `draft` → `approved` → `paid`. Only `draft` is editable; `approved` locks numbers; `paid` records payment date.
- Bulk actions: recalculate, approve, mark paid, email payslips.

### 6. Payslip PDF
- Generated via an edge function (`generate-payslip`) using a templated HTML → PDF (pdf-lib / Puppeteer-free approach: server-rendered HTML returned as `application/pdf` using `@react-pdf/renderer` style with Deno-compatible lib, or pre-built HTML returned to client which uses `react-to-print` / `html2pdf.js`).
  - Recommended: client-side `jspdf` + `jspdf-autotable` so we don't need a heavy server PDF runtime; payslip data already comes from the DB.
- Contains: company header, employee details, period, earnings table, deductions table, employer contributions (info), gross/taxable/PAYE/SSNIT/net summary, year-to-date totals, signatures area.
- Stored: regenerated on demand from DB (no need to persist the file).

### 7. Statutory reports
Page: `/crm/hr/statutory-reports`
- For a chosen month, export:
  - **GRA PAYE schedule** — per employee: name, TIN, gross, taxable, PAYE (CSV + PDF).
  - **SSNIT Tier 1 schedule** — per employee: SSNIT #, basic, employee 5.5%, employer 13%, total 18.5%.
  - **Tier 2 schedule** — per employee: SSNIT #, pensionable salary, 5% contribution, trustee.
- Totals row at bottom.

### 8. Employee self-service
Page: `/crm/hr/my-payslips`
- Every signed-in staff member sees only their own payslips (from `approved` or `paid` runs).
- Click → view PDF / download.

### 9. Audit
- All payroll-run state changes, statutory edits, and pay-item changes recorded in existing `audit_log`.

## Data model (new tables)

```text
employees
  user_id (unique, FK profiles.user_id)
  ssnit_number, tin, ghana_card_number
  bank_name, bank_account, momo_number, momo_network
  hire_date, termination_date, employment_type, status
  job_title, department, basic_salary
  tier2_trustee, notes

pay_items
  name (unique), item_type (allowance|deduction|employer_cost)
  taxable bool, pension_qualifying bool
  calc_method (fixed|percent_of_basic)
  default_value, active

employee_pay_items            -- recurring per-employee assignments
  employee_id, pay_item_id, amount_or_percent, active

paye_bands
  effective_from date, band_order int
  threshold_ghs numeric, rate_percent numeric

statutory_rates               -- single row per effective_from
  effective_from, ssnit_employee_pct, ssnit_employer_pct, tier2_pct

payroll_runs
  period_month date            -- 1st of month
  status (draft|approved|paid)
  notes, created_by, approved_by, approved_at, paid_at

payslips
  payroll_run_id, employee_id
  basic, gross, pensionable_gross, taxable_income
  ssnit_employee, ssnit_employer, tier2_employer
  paye, other_deductions, total_deductions
  net_pay
  ytd_gross, ytd_paye, ytd_ssnit       -- snapshot at run time

payslip_lines                 -- one row per allowance/deduction/override
  payslip_id, pay_item_id (nullable for one-offs)
  name, line_type, taxable, pension_qualifying, amount, source (recurring|override)
```

All tables RLS-on. Policies summary:
- HR/Finance/Admin: full CRUD on employees, pay_items, runs, payslips, statutory tables.
- Every authenticated user: SELECT own `employees` row, own `payslips` (only when run status is `approved`/`paid`), own `payslip_lines`.

## Calculation engine

Implemented as a Postgres function `calculate_payslip(employee_id, run_id)` and a small TS helper used by the UI to preview before saving. Both read from `paye_bands` and `statutory_rates` filtered to the run's `period_month`.

Order of operations:
1. Sum basic + allowances → gross.
2. Sum basic + pension-qualifying allowances → pensionable_gross.
3. ssnit_employee = pensionable_gross × 5.5%, ssnit_employer = ×13%, tier2 = ×5%.
4. taxable = gross − ssnit_employee − non-taxable allowances.
5. paye = cumulative band lookup over taxable.
6. net = gross − ssnit_employee − paye − other_deductions.

## UI structure

```text
Sidebar: HR & Payroll  (hr_officer / finance_officer / admin)
├── Dashboard            /crm/hr
├── Employees            /crm/hr/employees
├── Pay Items            /crm/hr/pay-items
├── Payroll Runs         /crm/hr/payroll-runs
│   └── Run detail       /crm/hr/payroll-runs/:id   (table of payslips, edit/recalc)
│       └── Payslip      /crm/hr/payslips/:id       (preview + PDF)
├── Statutory Settings   /crm/hr/statutory-settings  (admin only)
└── Statutory Reports    /crm/hr/statutory-reports

Sidebar: top-level "My Payslips" /crm/me/payslips   (every staff)
```

## Build phases (so we ship in slices, not one mega change)

1. **Phase A — Foundations**: enum role + helper, employees table + page, pay_items table + page, statutory tables seeded with current GRA bands.
2. **Phase B — Calculation**: payroll_runs + payslips + payslip_lines tables, calc function, run-creation flow, payslip detail view (no PDF yet).
3. **Phase C — Output**: PDF payslip, employee self-service "My Payslips", email payslip via existing Outlook integration.
4. **Phase D — Statutory exports**: GRA, SSNIT Tier 1, Tier 2 CSV/PDF schedules.

We start with Phase A and stop for review before Phase B.

## Out of scope (explicitly)
- Leave management, attendance, timesheets, performance reviews.
- Multi-currency or non-Ghana tax regimes.
- Direct bank-file payment generation (we'll just produce schedules).
- The on-prem hosting move — that's a future deployment task; nothing in this build prevents it because the stack stays Postgres + static frontend + edge functions.
