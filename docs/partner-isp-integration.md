# iKlick ↔ Partner ISP Ticket Integration

**Audience:** partner ISP engineering / API team
**Owner:** iKlick Communications — NOC & Platform team
**Version:** 1.0

## 1. Purpose

iKlick operates an internal NOC/CRM where customer faults are logged as **incidents**. When a fault sits on infrastructure operated by your network, we want that fault mirrored as a **ticket in your system**, kept in step for its whole lifecycle, and closed on both sides together.

This document describes what we send, what we expect back, and what we need from you to go live.

## 2. Integration overview

Two independent channels:

| Direction | Mechanism | Trigger |
|---|---|---|
| iKlick → Partner (outbound) | We call your REST API | Incident created, updated, noted, resolved/closed — automatically for linked accounts, plus manual escalation by our engineers |
| Partner → iKlick (inbound) | You call our webhook | Any status change, agent comment, or resolution on your ticket |

Both channels are JSON over HTTPS. Our connector is configuration-driven: endpoint paths, HTTP methods, auth header name, and field/status/priority names are all mapped per partner, so **you do not need to change your API to match ours**.

## 3. Outbound: what iKlick sends you

### 3.1 Authentication
We authenticate with a static credential you issue, sent on every request in a header you nominate. Defaults:

```
Authorization: Bearer <API_KEY>
Content-Type: application/json
Accept: application/json
```

Header name and prefix are configurable (e.g. `X-API-Key` with no prefix). The key is stored encrypted in our backend secret store and is never exposed to browsers or end users.

### 3.2 Endpoints we need from you

| Purpose | Method | Path (example) | Notes |
|---|---|---|---|
| Create ticket | POST | `/api/v1/tickets` | Must return the new ticket ID |
| Update ticket | PATCH or PUT | `/api/v1/tickets/{external_id}` | Method configurable |
| Add comment/note | POST | `/api/v1/tickets/{external_id}/comments` | |
| Close ticket | POST or PATCH | `/api/v1/tickets/{external_id}/close` | Optional — if absent we close via the update endpoint with a status value |

`{external_id}` is substituted with the ticket ID your create response returned.

### 3.3 Create payload

Field names below are our canonical names; each is remapped to yours via a field map we configure (defaults shown in brackets).

```json
{
  "subject": "Fibre down – Osu branch",          // title
  "description": "Customer reports total loss…", // description
  "priority": "high",                            // priority (mapped to your values)
  "status": "open",                              // status (mapped to your values)
  "external_reference": "INC-2026-000412",       // our incident number — please echo this back
  "account_reference": "ACCT-88213",             // your account ID for this customer
  "customer_name": "Royal Senchi Hotel",
  "category": "connectivity",
  "location": "5.6037, -0.1870"
}
```

`external_reference` is our incident number. **Storing and returning it is the single most useful thing you can do** — it lets us match your callbacks even if an ID is lost.

### 3.4 Expected create response

Any JSON shape works as long as an identifier is present. We read, in order of preference, from the root object or from `data` / `ticket` / `result`:

| We look for | Accepted keys |
|---|---|
| Ticket ID (required) | `id`, `ticket_id` |
| Human ticket number | `number`, `ticket_number`, `reference` |
| Web link to the ticket | `url`, `web_url`, `html_url` |
| Current status | `status`, `state` |

Example:

```json
{ "data": { "id": "884213", "number": "TCK-884213",
            "url": "https://partner.example/tickets/884213", "status": "new" } }
```

### 3.5 Update / comment / close payloads

* **Update** — same shape as create, with the current title, description, priority and mapped status.
* **Comment** — `{ "body": "Engineer dispatched, ETA 45 min", "external_reference": "INC-2026-000412" }`
* **Close** — `{ "status": "closed", "body": "<optional closing note>", "external_reference": "INC-2026-000412" }`

### 3.6 Error handling
Non-2xx responses are recorded verbatim (status + body) against the incident and shown to our engineers, who can retry manually. We do not hammer your API: there is no automatic retry loop.

## 4. Inbound: your callbacks to iKlick

### 4.1 Endpoint

```
POST https://tffhtsktcaskqhvpmwuk.supabase.co/functions/v1/partner-webhook?token=<WEBHOOK_TOKEN>
Content-Type: application/json
```

The token may instead be sent as a header: `x-partner-token: <WEBHOOK_TOKEN>`. iKlick issues this token — it is unique to you, at least 16 characters, and identifies your system. Treat it as a secret; we can rotate it on request.

### 4.2 Payload

Flexible: we read from the root object or from `data` / `ticket`.

```json
{
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

| Field | Required | Meaning |
|---|---|---|
| `id` / `ticket_id` | one of these or `reference` | Your ticket ID |
| `external_reference` / `reference` | one of these or `id` | Our incident number |
| `status` / `state` | optional | Your status value; mapped onto ours |
| `comment` / `note` | optional | Appended to the incident as an internal note |
| `author` / `agent` | optional | Shown as the note author |
| `number`, `url` | optional | Stored and shown as a deep link to your ticket |

### 4.3 Responses

| Code | Meaning |
|---|---|
| 200 | Matched and applied |
| 202 | Accepted but no matching incident found (logged; no retry needed) |
| 400 | Malformed JSON, or neither ticket ID nor reference supplied |
| 401 | Missing/invalid token |

Effects of a matched call: our incident status is updated per the status map, resolution/closure timestamps are set, your comment is added to the incident timeline, our network managers are notified, and the event is written to the per-incident sync history.

## 5. Status and priority mapping

Neither side has to adopt the other's vocabulary. We hold two-way maps, for example:

**Outbound (ours → yours)**

| iKlick | Partner |
|---|---|
| open | new |
| in_progress | working |
| escalated | escalated |
| resolved | resolved |
| closed | closed |

**Inbound (yours → ours)** — same table reversed. Our valid statuses are exactly: `open`, `in_progress`, `escalated`, `resolved`, `closed`. Unknown inbound statuses are stored for display but do not change our incident status.

Priorities map the same way (ours: `low`, `medium`, `high`, `critical`).

## 6. Account linking

Each iKlick client is linked to your account identifier (`account_reference`). Only linked clients sync; a per-client switch controls whether escalation is automatic or manual. Please supply a list of account IDs for the customers in scope.

## 7. Security

* All traffic over HTTPS/TLS.
* Your API key is stored in an encrypted secret store, used only in server-side functions, never in browser code.
* Your webhook token is unique to your system, revocable and rotatable.
* Only authenticated iKlick staff (Admin / Network Manager roles) can escalate or configure the integration.
* Every request and response is logged with timestamp, direction, action, HTTP status and payload for audit.

## 8. What we need from you to go live

1. API base URL (sandbox and production).
2. Endpoint paths and methods for create / update / comment / close.
3. Auth scheme: header name, prefix, and an API key or token.
4. Your ticket field names, and your status and priority value lists.
5. Account identifiers for the customers in scope.
6. Confirmation that you can POST to our webhook on status change and comment.
7. A sandbox ticket we can create and drive end-to-end.

## 9. Test plan

1. Create an incident on a linked test account → ticket appears in your system with our reference.
2. Add a note in iKlick → comment appears on your ticket.
3. Change status on your side → our incident status updates and the note lands in the timeline.
4. Resolve on your side → our incident resolves.
5. Close in iKlick → your ticket closes.
6. Review the sync history on both sides for a clean, error-free trail.

## 10. Contact

iKlick Communications — NOC & Platform team. Please direct API questions and credentials exchange to your iKlick account contact.
