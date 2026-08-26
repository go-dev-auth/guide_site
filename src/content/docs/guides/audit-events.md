---
title: Audit events
description: Every security-relevant event as a typed value - on by default, safe by construction.
---

```go
Events: godevauth.EventsConfig{
	Handler: func(ctx context.Context, e *godevauth.Event) {
		// e.Type, e.Outcome, e.Reason, e.ActorID, e.TargetID,
		// e.Email, e.SessionID, e.Method, e.Action,
		// e.ClientIP, e.UserAgent, e.RequestMethod, e.RequestPath
		siem.Send(e)
	},
},
```

Sign-in success and failure with the reason, sign-out, session creation
and revocation, password and email changes, account link/unlink and
deletion, 2FA enable/disable, bans, and administrator impersonation
start/stop - all emitted as typed `godevauth.Event` values.

Notable properties:

- **On by default.** With no `Handler`, events go to `Config.Logger` -
  successes at `Info`, failures at `Warn`. An audit trail that has to
  be switched on is missing from exactly the deployments that need it.
- **Events never contain secrets.** No passwords, session tokens or
  one-time tokens; there is no free-form field, and a test asserts the
  property by reflection.
- **Failure reasons are more specific than the HTTP response.** The
  client sees `INVALID_EMAIL_OR_PASSWORD` (no account enumeration); the
  event distinguishes `unknown_user` from `invalid_password` from
  `banned` - which is what tells credential stuffing apart from
  password guessing.
- **429s are recorded**, so throttled brute-force attempts leave a
  server-side trace.
- **`RequestPath` is the route pattern** (`/reset-password/:token`),
  never the resolved path containing the token.
- **Impersonation is bracketed** - while active, actions are recorded
  against the impersonated user, tied back to the administrator by the
  start/stop events.

Plugins emit their own with `auth.EmitEvent(c, godevauth.Event{...})`.
