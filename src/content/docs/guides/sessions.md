---
title: Sessions in your handlers
description: Reading the signed-in user from a request, and what the cookie cache trades away.
---

```go
func handler(w http.ResponseWriter, r *http.Request) {
	sd, err := auth.GetSession(r)
	if err != nil {
		// errors.Is(err, godevauth.ErrNoSession) → unauthenticated
	}
	_ = sd.User    // *storage.User
	_ = sd.Session // *storage.Session
}
```

Sessions are database-backed: 32-byte random tokens in HMAC-signed
cookies (with `__Secure-` prefixes on HTTPS), sliding expiration, and
list/revoke endpoints. Raw tokens never appear in session listings.

## The cookie cache

An authenticated request normally costs two queries (session, then
user). The cookie cache makes that zero:

```go
Session: godevauth.SessionConfig{
	CookieCache: godevauth.CookieCacheConfig{Enabled: true, MaxAge: 5 * time.Minute},
},
```

The trade is staleness: a revoked session keeps working until the
cached copy expires. The cache carries an absolute revalidation
deadline that is never extended from cached data, so revocation always
takes effect within `MaxAge`. When a plugin registers a `SessionGuard`
(the admin plugin's ban check is one), the cache is bypassed by default
rather than serving authorization decisions from a stale user.

## Cleanup

Expired sessions and one-time tokens are never collected implicitly:

```go
defer auth.StartCleanup(context.Background(), time.Hour)()
```
