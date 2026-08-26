---
title: Social sign-on
description: OAuth 2.0 / OIDC with PKCE. Eleven providers built in, custom providers in one declaration.
---

```go
import (
	"github.com/go-dev-auth/go-dev-auth/oauth2"
	"github.com/go-dev-auth/go-dev-auth/providers"
)

godevauth.Config{
	SocialProviders: []oauth2.Provider{
		providers.Google(providers.Credentials{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		}),
		providers.GitHub(providers.Credentials{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		}),
	},
}
```

Built in: Google, GitHub, Discord, Facebook, Microsoft, Apple, GitLab,
LinkedIn, Spotify, Twitch, X. Set the provider's redirect URI to
`{BaseURL}/api/auth/callback/{provider}`.

A custom provider is a single declaration - `oauth2.New(oauth2.Spec{...})`.

## What the flow enforces

- **PKCE (S256)** on every authorization request.
- **State** is pinned to the browser with a cookie *and* to the issuing
  provider, single-use and expiring.
- **Automatic account linking** requires both a provider-asserted
  verified email **and** that the provider is listed in
  `Account.AccountLinking.TrustedProviders`. An unverified or self-set
  address at the IdP cannot take over an existing local account.
- **ID tokens** ("sign in with X") are verified against the issuer's
  published JWKS - signature, `iss`, `aud` (plus `azp` for
  multi-audience tokens), `exp` and the nonce. Keys are cached with a
  bounded stale-serve window.

Related endpoints: `POST /sign-in/social`, `GET|POST
/callback/:provider`, `POST /link-social`, `POST /unlink-account`,
`GET /list-accounts`, `POST /refresh-token`, `GET /account-info`.
