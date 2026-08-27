# iKlick ↔ Partner ISP Ticket Integration — Integration Requirements

**Audience:** partner ISP engineering / API team
**Owner:** iKlick Communications — NOC & Platform team
**Version:** 2.0
**Status:** implementation contract (supersedes v1.0)

---

## 0. How to read this document

| Section | For |
|---|---|
| 1–3 | Architecture, ownership and lifecycle — read first |
| 4–6 | Outbound: what iKlick sends you |
| 7–8 | Inbound: what you send iKlick |
| 9–12 | Reliability: idempotency, retries, timeouts, correlation |
| 13–15 | Security, data protection, versioning |
| 16–18 | Configuration, onboarding checklist, test plan |

Keywords **MUST**, **SHOULD**, **MAY** follow RFC 2119.

---

## 1. Purpose and scope

iKlick operates an internal NOC/CRM in which customer faults are logged as **incidents**. When a fault sits on infrastructure operated by your network, that fault is mirrored as a **ticket in your system**, kept in step for its whole lifecycle, and closed on both sides in a defined order.

This document is the implementation contract: it states what we send, what we expect back, how failures are handled, and what we need from you to go live.

**Out of scope:** billing, provisioning, capacity orders, and bulk data exchange. This integration covers fault tickets only.

---

## 2. System of record

Both systems can change state, so authority is defined explicitly. **The partner owns its ticket. iKlick owns its incident.** Synchronisation *translates events* between the two systems; neither system is a replica of the other.

| Data | System of record |
|---|---|
| iKlick incident number (`external_reference`) | iKlick |
| Partner ticket ID / number / URL | Partner |
| Customer ↔ account relationship | iKlick |
| Incident origination | iKlick |
| Partner ticket status | Partner |
| iKlick incident status | iKlick (derived from mapped partner events) |
| Partner engineer assignment | Partner |
| iKlick internal notes | iKlick |
| Partner ticket comments | Partner (mirrored into iKlick) |
| SLA measurement and breach | iKlick |
| Integration/sync history | iKlick |

### 2.1 Conflict resolution

1. A field is only written by the side that does **not** own it when that side receives an explicit event from the owner.
2. Events are applied in **event timestamp order**. An event older than the last applied event for the same ticket is recorded and discarded (no state change).
3. If both sides change status within the same window, the **owner of the target field wins**: partner status wins for `partner_ticket.status`; iKlick status wins for `incident.status`. iKlick never mirrors its own status back out as a partner-authored change.
4. Any rejected or discarded event is written to the sync log with reason `stale_event` or `ownership_conflict`.

---

## 3. Integration overview

| Direction | Mechanism | Trigger |
|---|---|---|
| iKlick → Partner (outbound) | We call your REST API | Incident created, updated, noted, resolved/closed — automatically for linked accounts, plus manual escalation by our engineers |
| Partner → iKlick (inbound) | You call our webhook | Any status change, agent comment, or resolution on your ticket |

Both channels are JSON over HTTPS. Our connector is configuration-driven: endpoint paths, HTTP methods, auth header name, and field/status/priority names are mapped per partner, so **you do not need to change your API to match ours**.

---

## 4. Outbound: authentication and headers

We authenticate with a static credential you issue, sent on every request in a header you nominate. Defaults:

```
Authorization: Bearer <API_KEY>
Content-Type: application/json
Accept: application/json
Idempotency-Key: iklick-INC-2026-000412
X-Correlation-ID: cor_20260827_8f72
X-iKlick-Event-ID: evt_8f72a91c
```

Header name and prefix are configurable (e.g. `X-API-Key` with no prefix). The key is stored encrypted in our backend secret store and is never exposed to browsers or end users.

---

## 5. Outbound: endpoints and payloads

### 5.1 Endpoints we need from you

| Purpose | Method | Path (example) | Notes |
|---|---|---|---|
| Create ticket | POST | `/api/v1/tickets` | MUST return the new ticket ID |
| Update ticket | PATCH or PUT | `/api/v1/tickets/{external_id}` | Method configurable |
| Add comment/note | POST | `/api/v1/tickets/{external_id}/comments` | |
| Close ticket | POST or PATCH | `/api/v1/tickets/{external_id}/close` | Optional — if absent we close via the update endpoint with a status value |
| Fetch ticket (optional) | GET | `/api/v1/tickets/{external_id}` | Used for reconciliation sweeps (§9.4) |

`{external_id}` is substituted with the ticket ID your create response returned.

### 5.2 Create payload

Field names below are our canonical names; each is remapped to yours via a field map we configure.

```json
{
  "subject": "Fibre down – Osu branch",
  "description": "Customer reports total loss of service since 09:12.",
  "priority": "high",
  "status": "open",
  "external_reference": "INC-2026-000412",
  "account_reference": "ACCT-88213",
  "customer_name": "Royal Senchi Hotel",
  "category": "connectivity",
  "location": "5.6037, -0.1870"
}
```

`external_reference` is our incident number and doubles as the idempotency key (§9.1). **Storing and returning it is the single most useful thing you can do** — it lets us match your callbacks even if an ID is lost.

### 5.3 Expected create response

Any JSON shape works as long as an identifier is present. We read, in order of preference, from the root object or from `data` / `ticket` / `result`:

| We look for | Accepted keys |
|---|---|
| Ticket ID (required) | `id`, `ticket_id` |
| Human ticket number | `number`, `ticket_number`, `reference` |
| Web link to the ticket | `url`, `web_url`, `html_url` |
| Current status | `status`, `state` |

```json
{ "data": { "id": "884213", "number": "TCK-884213",
            "url": "https://partner.example/tickets/884213", "status": "new" } }
```

### 5.4 Update / comment / close payloads

* **Update** — same shape as create, with the current title, description, priority and mapped status.
* **Comment** — `{ "body": "Engineer dispatched, ETA 45 min", "external_reference": "INC-2026-000412" }`
* **Close** — `{ "status": "closed", "body": "<optional closing note>", "external_reference": "INC-2026-000412" }`

---

## 6. Status and priority mapping

Neither side has to adopt the other's vocabulary. We hold two-way maps, for example:

**Outbound (ours → yours)**

| iKlick | Partner |
|---|---|
| open | new |
| in_progress | working |
| escalated | escalated |
| resolved | resolved |
| closed | closed |

**Inbound (yours → ours)** — the same table reversed. Our valid statuses are exactly: `open`, `in_progress`, `escalated`, `resolved`, `closed`. Unknown inbound statuses are stored for display but do not change our incident status.

Priorities map the same way (ours: `low`, `medium`, `high`, `critical`).

### 6.1 Permitted transitions

```
open        → in_progress | escalated | resolved | closed
in_progress → escalated  | resolved   | closed
escalated   → in_progress | resolved  | closed
resolved    → closed      | open        (reopen)
closed      → open                       (reopen)
```

Reopening **is permitted**: a customer may report that a supposedly resolved fault is still present. A reopen resets `resolved_at`/`closed_at` and restarts SLA measurement from the reopen timestamp. Transitions outside this table are logged as `invalid_transition` and do not change state.

### 6.2 Closure ownership

Resolution and closure are separate steps with different owners.

```
Partner resolves ticket
        ↓  (webhook: ticket.resolved)
iKlick incident → resolved
        ↓  (iKlick NOC confirms with the customer)
iKlick incident → closed
        ↓  (outbound close call)
Partner ticket → closed
```

**iKlick is authoritative for final closure**, because only iKlick can confirm with the customer that service is genuinely restored. A partner `closed` event moves our incident to `resolved` (not `closed`) and sets integration state `partner_closed`. If your operational model requires partner closure to be authoritative, tell us during onboarding and we will set the per-partner flag `partner_closure_authoritative = true`, in which case a partner `closed` event closes our incident directly.

---

## 7. Inbound: your callbacks to iKlick

### 7.1 Endpoint

```
POST https://tffhtsktcaskqhvpmwuk.supabase.co/functions/v1/partner-webhook
Content-Type: application/json
X-iKlick-Signature: sha256=<hex>
X-iKlick-Timestamp: 1756290600
X-iKlick-Event-ID: evt_8f72a91c
```

### 7.2 Authentication — HMAC signing (preferred)

Compute over the **raw request body bytes**, before any parsing or re-serialisation:

```
signature = HMAC_SHA256(webhook_secret, timestamp + "." + raw_body)
X-iKlick-Signature: sha256=<lowercase hex digest>
```

`X-iKlick-Timestamp` is Unix seconds. We verify, in order:

1. Timestamp is within **±300 seconds** of our clock — otherwise `401`.
2. Signature matches, using a constant-time comparison — otherwise `401`.
3. `X-iKlick-Event-ID` has not been processed before — otherwise `200` with `{"duplicate": true}` and no state change.

iKlick issues the webhook secret (32 bytes, hex). It is unique to you, revocable and rotatable; during rotation both the old and new secrets are accepted for 24 hours.

### 7.3 Authentication — bearer token (fallback)

For partners that cannot sign requests:

```
POST .../partner-webhook?token=<WEBHOOK_TOKEN>
```
or the header `x-partner-token: <WEBHOOK_TOKEN>`. The token is at least 16 characters and identifies your system. This mode is supported but **HMAC is strongly preferred**; token-only partners are recorded as such in our integration register.

### 7.4 Payload

```json
{
  "event_id": "evt_8f72a91c",
  "event_type": "ticket.status_changed",
  "timestamp": "2026-08-27T10:30:00Z",
  "data": {
    "id": "884213",
    "number": "TCK-884213",
    "status": "in_progress",
    "url": "https://partner.example/tickets/884213",
    "external_reference": "INC-2026-000412",
    "comment": "Fibre cut located at Spintex, splice team en route",
    "author": "K. Mensah"
  }
}
```

We also accept the flat/legacy shape (fields read from the root or from `data` / `ticket`).

| Field | Required | Meaning |
|---|---|---|
| `event_id` | SHOULD | Unique per event; drives deduplication |
| `event_type` | SHOULD | One of `ticket.created`, `ticket.status_changed`, `ticket.commented`, `ticket.resolved`, `ticket.closed`, `ticket.reopened` |
| `timestamp` | SHOULD | ISO 8601 UTC; used for ordering (§2.1) |
| `data.id` / `data.ticket_id` | one of these or `reference` | Your ticket ID |
| `data.external_reference` / `reference` | one of these or `id` | Our incident number |
| `data.status` / `state` | optional | Your status value; mapped onto ours |
| `data.comment` / `note` | optional | Appended to the incident as an internal note |
| `data.author` / `agent` | optional | Shown as the note author |
| `data.number`, `data.url` | optional | Stored and shown as a deep link to your ticket |

### 7.5 Event deduplication

We persist every received event:

```
event_id · partner_system · received_at · processed_at · processing_status · payload
```

A repeated `event_id` returns `200 {"duplicate": true, "processed_at": "…"}` and changes nothing. Events without an `event_id` are deduplicated on a hash of `(partner, ticket id, status, comment, timestamp)` within a 10-minute window.

### 7.6 Responses

| Code | Meaning | Should you retry? |
|---|---|---|
| 200 | Matched and applied (or duplicate) | No |
| 202 | Accepted, no matching incident found (logged) | No |
| 400 | Malformed JSON, or neither ticket ID nor reference supplied | No — fix and resend |
| 401 | Missing/invalid token, bad signature, stale timestamp | No — check credentials/clock |
| 409 | Stale or conflicting event (§2.1) | No |
| 429 | Rate limited (see `Retry-After`) | Yes |
| 5xx | Our fault | Yes, with backoff (§9.2) |

Effects of a matched call: our incident status is updated per the status map and transition rules, resolution/closure timestamps are set, your comment is added to the incident timeline, our network managers are notified, and the event is written to the per-incident sync history.

We accept a webhook body up to **256 KB** and respond within 5 seconds; processing is synchronous.

---

## 8. Integration state

Integration state is **separate from incident status** — `incident.status` is never overloaded with sync information.

| `sync_status` | Meaning |
|---|---|
| `not_synced` | No partner ticket; incident is iKlick-only |
| `pending` | Outbound call queued or in flight |
| `synced` | Both sides agree; last exchange succeeded |
| `sync_error` | Last exchange failed; retries exhausted or permanent error |
| `partner_closed` | Partner closed their ticket; our incident awaits iKlick confirmation |

`sync_status` drives the health dashboard (§12) and the engineer-facing retry controls.

---

## 9. Reliability

### 9.1 Idempotency

Every outbound **create** carries a stable idempotency key derived from our incident number:

```
Idempotency-Key: iklick-INC-2026-000412
```

and the same value in the body as `external_reference`.

**You MUST guarantee that the same `external_reference` (or `Idempotency-Key`) cannot create more than one active ticket.** On a repeated create you SHOULD return `200`/`201` with the *existing* ticket's details rather than creating a second one. Keys are retained for at least 24 hours.

Updates, comments and closes are keyed as `iklick-INC-2026-000412-<action>-<attempt-group>` so a replayed comment does not duplicate.

### 9.2 Retries

Transient failures (`408`, `429`, `500`, `502`, `503`, `504`, connection reset, timeout) are retried automatically with limited exponential backoff:

```
Attempt 1 → immediately
Attempt 2 → +30 seconds
Attempt 3 → +2 minutes
Attempt 4 → +10 minutes
        ↓ still failing
sync_status = sync_error → engineer notified → manual retry available
```

Permanent failures (`400`, `401`, `403`, `404`, `409`, `422`) are **not** retried automatically; they surface to our engineers immediately and can be retried manually once configuration or data is corrected. `429` honours `Retry-After` when present.

We expect the same retry discipline on your inbound webhooks (§7.6).

### 9.3 Timeouts

| Setting | Default | Configurable |
|---|---|---|
| Connection timeout | 10 seconds | Yes, per partner |
| Response timeout | 30 seconds | Yes, per partner |

A timeout is treated as a transient failure. Because a timed-out create may still have succeeded on your side, the idempotency guarantee in §9.1 is what prevents duplicate tickets.

### 9.4 Reconciliation

If you expose a fetch endpoint (§5.1), we run a daily sweep over tickets in `pending` or `sync_error` state and reconcile status and ticket IDs. Without it, reconciliation is manual.

### 9.5 Rate limits

Tell us your rate limit; we default to a conservative **60 requests/minute per partner** with client-side queuing. We will not burst beyond that without agreement.

---

## 10. Correlation and audit

Every outbound request carries:

```
X-Correlation-ID: cor_20260827_8f72
```

The same correlation ID appears on the incident, the sync log row, and any resulting webhook we can attribute to it. Please echo it back in responses and include it in your own logs where practical. A typical NOC trace reads:

```
Incident            INC-2026-000412
Correlation ID      cor_20260827_8f72
Outbound request    POST /api/v1/tickets
Partner response    201
Partner ticket      884213
Inbound event       evt_8f72a91c  ticket.status_changed → in_progress
```

Every request and response is logged with timestamp, direction, action, HTTP status, correlation ID, event ID and payload.

---

## 11. Account linking

Each iKlick client is linked to your account identifier (`account_reference`). Only linked clients sync; a per-client switch controls whether escalation is automatic or manual. Please supply a list of account IDs for the customers in scope.

---

## 12. Integration health dashboard (iKlick side)

Admin/NOC users see a live per-partner panel:

```
Partner: XYZ Telecom            Status: Healthy

API                Connected          Webhook            Receiving
Last request       10:41:23           Last webhook       10:42:17
Tickets synced     1,284              Failed events      2
Pending retries    0                  Duplicate events   17
```

Health is derived from `sync_status` counts, the age of the last successful call in each direction, and the failed/retry queues. Degraded and failed states raise a notification to network managers.

---

## 13. Security

* All traffic over HTTPS/TLS 1.2+.
* Your API key is stored in an encrypted secret store, used only in server-side functions, never in browser code.
* Webhook secret/token is unique to your system, revocable and rotatable, with a 24-hour dual-accept rotation window.
* HMAC signing with timestamp and event-ID replay protection is the preferred inbound scheme (§7.2).
* Only authenticated iKlick staff (Admin / Network Manager roles) can escalate or configure the integration.
* Full request/response audit trail (§10).
* Please supply the source IP ranges your webhooks originate from if you can; we can allow-list them.

---

## 14. Data protection

**Only information necessary for fault identification and service restoration is transmitted to the partner.**

Transmitted: incident reference, fault subject and technical description, priority, status, service category, account reference, site location, and operational comments.

Never transmitted:

* Personal information beyond the operational site contact
* Internal CRM notes not explicitly marked for partner sharing
* Billing, invoicing, pricing or contract data
* Passwords, API keys or any authentication credentials
* Internal network security detail (topology, device credentials, management addressing)

Retention: sync logs and event records are retained for **24 months**, then purged. Payloads are stored for audit and are visible only to Admin and Network Manager roles. Both parties act as independent controllers for their own records and will notify the other of any breach affecting shared data within 72 hours.

---

## 15. Versioning

* Both sides use a versioned API path (`/api/v1/`).
* Additive, backward-compatible changes (new optional fields, new event types) may ship without a version bump; unknown fields MUST be ignored by the receiver.
* **Breaking changes require a new API version** and 30 days' written notice, with both versions served in parallel during the transition.
* This document is versioned; the version in force is agreed at onboarding.

---

## 16. Integration configuration model

The connector is configuration-driven. Each partner record holds:

```text
Partner
 ├── Name / enabled flag
 ├── API base URL (sandbox, production)
 ├── Authentication
 │    ├── Header name          (default: Authorization)
 │    ├── Prefix               (default: "Bearer ")
 │    └── API key              (encrypted secret)
 ├── Endpoints
 │    ├── Create   (method + path)
 │    ├── Update   (method + path)
 │    ├── Comment  (method + path)
 │    ├── Close    (method + path, optional)
 │    └── Fetch    (method + path, optional)
 ├── Field mapping             (canonical → partner field names)
 ├── Status mapping            (outbound + inbound)
 ├── Priority mapping          (outbound + inbound)
 ├── Account mapping           (iKlick client → account_reference)
 ├── Webhook
 │    ├── Secret (HMAC)        (encrypted)
 │    ├── Token (fallback)     (encrypted)
 │    └── Signature scheme     (hmac_sha256 | token)
 ├── Reliability
 │    ├── Connection timeout   (default 10s)
 │    ├── Response timeout     (default 30s)
 │    ├── Retry schedule       (default 0s / 30s / 2m / 10m)
 │    └── Rate limit           (default 60 rpm)
 └── Behaviour flags
      ├── auto_escalate (per client)
      └── partner_closure_authoritative (default false)
```

---

## 17. What we need from you to go live

1. API base URL — sandbox and production.
2. Endpoint paths and methods for create / update / comment / close (and fetch, if available).
3. Auth scheme: header name, prefix, and an API key or token.
4. Your ticket field names, and your status and priority value lists.
5. Confirmation of idempotency behaviour on `external_reference` / `Idempotency-Key` (§9.1).
6. Your rate limit, and your timeout expectations.
7. Confirmation you can POST to our webhook on status change, comment, resolution and closure — and whether you can HMAC-sign (§7.2).
8. Account identifiers for the customers in scope.
9. Whether closure is iKlick-authoritative (default) or partner-authoritative (§6.2).
10. Webhook source IP ranges, if fixed.
11. Technical and escalation contacts, plus your maintenance window.
12. A sandbox ticket we can create and drive end-to-end.

---

## 18. Test plan

| # | Test | Expected result |
|---|---|---|
| 1 | Create an incident on a linked test account | Ticket appears in your system carrying our `external_reference` |
| 2 | Replay the same create (same `Idempotency-Key`) | No second ticket; existing ticket returned |
| 3 | Add a note in iKlick | Comment appears on your ticket |
| 4 | Change status on your side | Our incident status updates; note lands in the timeline |
| 5 | Resend the same webhook `event_id` | `200 {"duplicate": true}`, no state change |
| 6 | Send a webhook with a bad signature | `401`, nothing applied |
| 7 | Send a webhook with a 10-minute-old timestamp | `401`, nothing applied |
| 8 | Return `503` to one outbound call | Automatic retry succeeds; sync history shows retry, not failure |
| 9 | Hold a response past 30s | Timeout recorded; retry does not duplicate the ticket |
| 10 | Resolve on your side | Our incident resolves; `sync_status` shows `synced` |
| 11 | Close in iKlick | Your ticket closes |
| 12 | Reopen after closure | Both sides reopen; SLA restarts |
| 13 | Review sync history and correlation IDs on both sides | Clean, matchable, error-free trail |

---

## 19. Contact

iKlick Communications — NOC & Platform team. Please direct API questions and credentials exchange to your iKlick account contact.
