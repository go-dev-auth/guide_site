---
title: Configuration
description: One config struct, mirroring better-auth's options.
---

`godevauth.Config` mirrors better-auth's options:

- **`EmailAndPassword`** - enable/disable, min/max length, verification
  requirements, reset delivery, custom `PasswordHasher`.
- **`EmailVerification`** - delivery and required-before-sign-in rules.
- **`Session`** - `ExpiresIn`, `UpdateAge`, `FreshAge`, cookie cache.
- **`User`** - additional fields, change-email, delete-user flows.
- **`Account`** - linking rules, trusted providers, OAuth token
  encryption at rest.
- **`Advanced`** - cookie prefix, cross-subdomain cookies, SameSite,
  proxy trust, custom ID generation, CSRF exemptions, auto-migration.
- **`TrustedOrigins`** - CSRF origin allow-list, wildcard subdomains.
- **`RateLimit`** - windows, per-path rules, pluggable store for
  multi-instance deployments.
- **`Events`** - the audit hook.
- **`PreviousSecrets`** - secret rotation.
- **`Hooks` / `DatabaseHooks`** - request and persistence interception.

Rate-limit rules in `RateLimit.CustomRules` may be keyed by route
pattern (`"/reset-password/:token"`) as well as literal path - buckets
are keyed by the pattern, so a parameterised route is limited as one
endpoint, not one bucket per token value.

## Custom user fields

Extra columns are declared on the config and are **not** client-writable
unless you say so - the difference between a profile field and a
privilege:

```go
User: godevauth.UserConfig{
	AdditionalFields: []storage.Field{
		{Name: "displayName", Type: storage.FieldString, Input: true}, // user may set it
		{Name: "plan",        Type: storage.FieldString},              // server-controlled
	},
},
```

Fields contributed by plugins (`role`, `banned`, `twoFactorEnabled`, …)
are never writable from a request body, whatever `Input` says.

For the full field-by-field reference, see the
[pkg.go.dev documentation](https://pkg.go.dev/github.com/go-dev-auth/go-dev-auth).
