---
title: Plugins
description: Two-factor, passkeys, magic links, organizations, SSO, admin, API keys, JWT and bearer auth - each a plugin, mirroring better-auth.
---

```go
import (
	"github.com/go-dev-auth/go-dev-auth/plugins/admin"
	"github.com/go-dev-auth/go-dev-auth/plugins/jwt"
	"github.com/go-dev-auth/go-dev-auth/plugins/magiclink"
	"github.com/go-dev-auth/go-dev-auth/plugins/organization"
	"github.com/go-dev-auth/go-dev-auth/plugins/passkey"
	"github.com/go-dev-auth/go-dev-auth/plugins/sso"
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
		passkey.New(),
		sso.New(sso.Options{
			// gate who may register identity providers
			Authorize: func(c *godevauth.Ctx, sd *godevauth.SessionData) error {
				return myApp.RequireAdmin(sd)
			},
		}),
	},
}
```

| Plugin | What it adds |
|---|---|
| `twofactor` | TOTP, email OTP and backup codes - every code is single-use, so a captured code cannot be replayed |
| `passkey` | WebAuthn passkeys - registration, passwordless sign-in, credential management |
| `magiclink` | Passwordless email links |
| `organization` | Orgs, members, roles, invitations, teams |
| `sso` | Bring-your-own OIDC identity provider, matched by email domain |
| `admin` | User management, bans, roles, impersonation |
| `apikey` | Hashed API keys with scopes that authenticate like sessions |
| `jwt` | EdDSA-signed JWTs + JWKS endpoint |
| `bearer` | Authorization-header auth for non-browser clients - signed tokens required by default; raw session tokens need the explicit `AllowUnsignedTokens` opt-in |

## Passkeys

`plugins/passkey` implements WebAuthn with no external dependency - the
CBOR/COSE parsing and ES256/RS256/Ed25519 signature verification live in
the package. Registration requires a fresh session; sign-in uses
discoverable credentials and runs through the same `SignInUser` gate as
every other method, so bans and two-factor policy still apply.
Challenges are single-use and expire (5 minutes by default), the origin
and relying-party id are checked against `Config.BaseURL` (override with
`passkey.Options{RPID, Origins}`), and the signature counter is checked
for the cloned-authenticator case.

Endpoints: `GET /passkey/generate-register-options`,
`POST /passkey/verify-registration`,
`POST /passkey/generate-authenticate-options`,
`POST /passkey/verify-authentication`,
`GET /passkey/list-user-passkeys`,
`POST /passkey/{delete-passkey,update-passkey}`.

## SSO

`plugins/sso` lets each organization bring its own OpenID Connect
identity provider (Okta, Microsoft Entra, Google Workspace, Keycloak).
Providers are registered at runtime - endpoints discovered from
`/.well-known/openid-configuration` - matched to users by email domain,
and sign-in runs through the same OAuth machinery as social login:
browser-bound single-use state, PKCE, ID-token verification against the
issuer's JWKS. Client secrets are encrypted at rest.

The management endpoints (`/sso/register`, `/sso/list`, `/sso/delete`)
**fail closed until `Options.Authorize` is set**: "any signed-in user
may point a login domain at their own IdP" would be an account-takeover
primitive, so there is no safe default. Registration from Go code
(`RegisterProvider`) is not gated.

Endpoints: `POST /sign-in/sso`, `POST /sso/register`, `GET /sso/list`,
`POST /sso/delete`, `GET|POST /callback/sso:<providerId>`.

## Guards cannot be bypassed

Every sign-in path - password, magic link, social, passkey, SSO,
verification auto-login - funnels through one internal `SignInUser`, so
a plugin implementing `SignInGuard` (two-factor challenges, bans)
applies to all of them; picking another sign-in method is not a bypass.
`SessionGuard` additionally re-checks every request, so a ban takes
effect immediately rather than at next login.

## Writing your own

A plugin implements three methods - `ID`, `Init`, `Routes` - and
optionally `Schema` (tables/columns it needs), `Middleware`,
`BeforeRequest`/`AfterRequest`, `SignInGuard` or `SessionGuard`. The
repository ships a test harness in `plugins/plugintest` and a guide in
[docs/writing-a-plugin.md](https://github.com/go-dev-auth/go-dev-auth/blob/main/docs/writing-a-plugin.md).
