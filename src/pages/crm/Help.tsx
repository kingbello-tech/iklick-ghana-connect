import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Target,
  TrendingUp,
  ClipboardCheck,
  Wrench,
  Receipt,
  Wallet,
  ArrowRight,
  Sparkles,
  Bell,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";

type Audience = "all" | "sales" | "technology" | "finance";

interface PhaseStep {
  step: string;
  title: string;
  who: string;
  description: string;
  autoActions?: string[];
  link?: { label: string; to: string };
}

interface Phase {
  id: Audience;
  number: string;
  title: string;
  subtitle: string;
  icon: typeof Target;
  gradient: string;
  steps: PhaseStep[];
}

const PHASES: Phase[] = [
  {
    id: "sales",
    number: "01",
    title: "Sales",
    subtitle: "Lead → Qualified → Won",
    icon: Target,
    gradient: "from-primary to-accent",
    steps: [
      {
        step: "1.1",
        title: "Capture a Lead",
        who: "Sales Representative",
        description:
          "Create a new lead with contact info, type (home / SME / enterprise), and source. Assign to a sales rep.",
        link: { label: "Open Leads", to: "/crm/sales/leads" },
      },
      {
        step: "1.2",
        title: "Convert Lead → Deal",
        who: "Sales Representative",
        description:
          "Set title, MRC (monthly), NRC (one-off), contract duration and ISP category (FTTH / DIA / VoIP / Community WiFi). TCV and ACV auto-calculate.",
      },
      {
        step: "1.3",
        title: "Move Through Pipeline Stages",
        who: "Sales Representative / Manager",
        description:
          "Drag deal cards across stages: New Lead → Qualification → Site Survey → Proposal → Negotiation → Won/Lost.",
        autoActions: [
          "Stage = site_survey → creates a survey row & notifies Technology",
          "Stage = closed_won → creates an installation row & notifies Tech Manager",
          "Every change is written to audit_log",
        ],
        link: { label: "Open Pipeline", to: "/crm/sales/pipeline" },
      },
    ],
  },
  {
    id: "technology",
    number: "02",
    title: "Technology",
    subtitle: "Survey → Install → Ready to bill",
    icon: Wrench,
    gradient: "from-accent to-primary",
    steps: [
      {
        step: "2.1",
        title: "Site Survey",
        who: "Technology Engineer / Manager",
        description:
          "When a deal hits 'site_survey', a survey appears in the queue. Manager assigns an engineer; engineer fills in feasibility, cost estimate, infrastructure notes and photos.",
        autoActions: [
          "On Completed → stamps deals.survey_completed_at",
          "Notifies the assigned Sales Rep: 'Ready for negotiation'",
        ],
        link: { label: "Survey Queue", to: "/crm/technology/surveys" },
      },
      {
        step: "2.2",
        title: "Installation",
        who: "Technology Engineer / Manager",
        description:
          "When a deal is Won, an installation row is auto-created. Manager assigns an engineer and sets a date; engineer marks it Completed when on-site work is done.",
        autoActions: [
          "Stamps deals.installation_completed_at",
          "Notifies all Finance Officers: 'Ready for invoicing'",
          "Auto-creates a draft invoice (NRC + first month MRC, 15% VAT)",
        ],
        link: { label: "Installation Queue", to: "/crm/technology/installations" },
      },
    ],
  },
  {
    id: "finance",
    number: "03",
    title: "Finance",
    subtitle: "Invoice → Payment → Recurring",
    icon: Wallet,
    gradient: "from-primary via-accent to-primary",
    steps: [
      {
        step: "3.1",
        title: "Review Draft Invoices",
        who: "Finance Officer",
        description:
          "Open the Finance Dashboard to see Drafts, Outstanding, Collected and Total. Click any draft from Recent Invoices to review line items.",
        link: { label: "Finance Dashboard", to: "/crm/finance/dashboard" },
      },
      {
        step: "3.2",
        title: "Send the Invoice",
        who: "Finance Officer",
        description:
          "On invoice detail, verify MRC / NRC / VAT / total, then change status from Draft → Sent.",
        autoActions: [
          "Stamps sent_at on the invoice",
          "Activates billing on the deal (billing_active_at = now())",
          "Notifies the assigned Sales Rep",
        ],
      },
      {
        step: "3.3",
        title: "Record Payment",
        who: "Finance Officer",
        description:
          "Click Record Payment on the invoice. Enter amount, method (bank transfer / mobile money / cash / cheque / card) and reference.",
        autoActions: [
          "Updates amount_paid, balance_due",
          "Sets status to partially_paid or paid; stamps paid_at",
        ],
      },
      {
        step: "3.4",
        title: "Issue Invoice Without a Deal",
        who: "Finance Officer",
        description:
          "Two paths: from Finance → Clients, click Invoice beside any client; or from the dashboard, click New Invoice and pick the client (deal optional).",
        link: { label: "Finance Clients", to: "/crm/finance/clients" },
      },
      {
        step: "3.5",
        title: "Monthly Recurring Billing",
        who: "Finance Officer",
        description:
          "Click 'Generate Monthly Recurring' on the dashboard. Every deal with billing_active_at + MRC > 0 gets a fresh draft invoice for the month.",
      },
    ],
  },
];

const ROLE_TO_AUDIENCE: Record<string, Audience> = {
  sales_representative: "sales",
  sales_manager: "sales",
  technology_engineer: "technology",
  technology_manager: "technology",
  finance_officer: "finance",
};

export default function Help() {
  const { role, profile } = useAuth();
  const defaultAudience: Audience = role ? ROLE_TO_AUDIENCE[role] ?? "all" : "all";
  const [audience, setAudience] = useState<Audience>(defaultAudience);

  const visiblePhases = useMemo(
    () => (audience === "all" ? PHASES : PHASES.filter((p) => p.id === audience)),
    [audience]
  );

  const filters: { id: Audience; label: string }[] = [
    { id: "all", label: "Full lifecycle" },
    { id: "sales", label: "Sales" },
    { id: "technology", label: "Technology" },
    { id: "finance", label: "Finance" },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/40 p-8 md:p-12">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            iKlick CRM Playbook
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight">
            Sales <span className="gradient-text">→</span> Technology{" "}
            <span className="gradient-text">→</span> Finance
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground text-base md:text-lg">
            How a deal moves through iKlick — who acts, what the system does automatically,
            and where to click. {profile?.full_name ? `Welcome back, ${profile.full_name}.` : ""}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setAudience(f.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition-all border ${
                  audience === f.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lifecycle visual */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Target, label: "Sales", desc: "Capture & qualify", to: "/crm/sales/pipeline" },
          { icon: Wrench, label: "Technology", desc: "Survey & install", to: "/crm/technology/dashboard" },
          { icon: Receipt, label: "Finance", desc: "Bill & collect", to: "/crm/finance/dashboard" },
        ].map((s, i) => (
          <Link key={s.label} to={s.to} className="group relative">
            <Card className="h-full border-border bg-card transition-all group-hover:border-primary/50 group-hover:shadow-lg">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Phase {i + 1}</p>
                  <p className="text-lg font-semibold text-foreground">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Phases */}
      {visiblePhases.map((phase) => (
        <section key={phase.id} className="space-y-5">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${phase.gradient} flex items-center justify-center text-primary-foreground shadow-lg`}>
                <phase.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Phase {phase.number}</p>
                <h2 className="text-2xl md:text-3xl font-bold">{phase.title}</h2>
                <p className="text-sm text-muted-foreground">{phase.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="relative pl-6 md:pl-8">
            {/* Vertical timeline line */}
            <div className="absolute left-2 md:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-border to-transparent" />

            <div className="space-y-4">
              {phase.steps.map((step) => (
                <div key={step.step} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-6 md:-left-8 top-6 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-md" />

                  <Card className="border-border bg-card hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">
                          Step {step.step}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{step.who}</Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>

                      {step.autoActions && step.autoActions.length > 0 && (
                        <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                            <Zap className="h-3.5 w-3.5" />
                            System auto-actions
                          </div>
                          <ul className="space-y-1.5">
                            {step.autoActions.map((a) => (
                              <li key={a} className="flex items-start gap-2 text-sm text-foreground/90">
                                <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                                <span>{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.link && (
                        <div className="mt-4">
                          <Button asChild size="sm" variant="outline">
                            <Link to={step.link.to}>
                              {step.link.label}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Roles + Notifications grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Role quick reference</h3>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                ["Sales Rep", "Create leads/deals, move pipeline, view own data"],
                ["Sales Manager", "All sales + targets + view all sales data"],
                ["Tech Engineer", "Update assigned surveys & installations"],
                ["Tech Manager", "Assign engineers, manage queues"],
                ["Finance Officer", "Create/send invoices, payments, recurring"],
                ["Admin", "Everything + user management + audit logs"],
              ].map(([r, what]) => (
                <li key={r} className="flex items-start justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <span className="font-medium text-foreground shrink-0">{r}</span>
                  <span className="text-muted-foreground text-right">{what}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Notifications you'll get</h3>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                ["Sales Rep", "Site Survey Completed · Invoice Sent for your deal"],
                ["Tech Manager", "New Installation Request when a deal is won"],
                ["Finance Officer", "New Invoice Drafted · Recurring Invoices Generated"],
                ["Admin", "Copies of all major lifecycle events"],
              ].map(([r, what]) => (
                <li key={r} className="flex items-start justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  <span className="font-medium text-foreground shrink-0">{r}</span>
                  <span className="text-muted-foreground text-right">{what}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
