---
title: Plugins
description: Two-factor, magic links, organizations, admin, API keys, JWT and bearer auth - each a plugin, mirroring better-auth.
---

```go
import (
	"github.com/go-dev-auth/go-dev-auth/plugins/admin"
	"github.com/go-dev-auth/go-dev-auth/plugins/jwt"
	"github.com/go-dev-auth/go-dev-auth/plugins/magiclink"
	"github.com/go-dev-auth/go-dev-auth/plugins/organization"
	"github.com/go-dev-auth/go-dev-auth/plugins/twofactor"
)

godevauth.Config{
	Plugins: []godevauth.Plugin{
		twofactor.New(),
		organization.New(organization.Options{Teams: true}),
		admin.New(),
		jwt.New(),
		magiclink.New(magiclink.Options{
			SendMagicLink: func(ctx context.Context, email, url, token string) error {
				return mailer.Send(email, "Sign in", url)
			},
		}),
	},
}
```

| Plugin | What it adds |
|---|---|
| `twofactor` | TOTP, email OTP and backup codes |
| `magiclink` | Passwordless email links |
| `organization` | Orgs, members, roles, invitations, teams |
| `admin` | User management, bans, roles, impersonation |
| `apikey` | Hashed API keys that authenticate like sessions |
| `jwt` | EdDSA-signed JWTs + JWKS endpoint |
| `bearer` | Authorization-header auth for non-browser clients |

## Guards cannot be bypassed

Every sign-in path - password, magic link, social, verification
auto-login - funnels through one internal `SignInUser`, so a plugin
implementing `SignInGuard` (two-factor challenges, bans) applies to all
of them; picking another sign-in method is not a bypass. `SessionGuard`
additionally re-checks every request, so a ban takes effect immediately
rather than at next login.

## Writing your own

A plugin implements three methods - `ID`, `Init`, `Routes` - and
optionally `Schema` (tables/columns it needs), `Middleware`,
`BeforeRequest`/`AfterRequest`, `SignInGuard` or `SessionGuard`. The
repository ships a test harness in `plugins/plugintest` and a guide in
[docs/writing-a-plugin.md](https://github.com/go-dev-auth/go-dev-auth/blob/main/docs/writing-a-plugin.md).
