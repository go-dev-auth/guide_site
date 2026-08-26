---
title: Getting started
description: Install go-dev-auth and mount a working auth handler in one file.
---

go-dev-auth is an embedded library: it mounts as a plain `http.Handler`
inside your own Go process. There is no server to deploy.

## Install

```bash
go get github.com/go-dev-auth/go-dev-auth
```

Requires Go 1.22 or newer.

## A complete server

```go
package main

import (
	"context"
	"net/http"
	"os"
	"time"

	godevauth "github.com/go-dev-auth/go-dev-auth"
	"github.com/go-dev-auth/go-dev-auth/storage/memory"
)

func main() {
	auth, err := godevauth.New(godevauth.Config{
		BaseURL:  "http://localhost:8080",  // required
		Secret:   os.Getenv("AUTH_SECRET"), // required, 32+ random chars
		Database: memory.New(),             // required
		EmailAndPassword: godevauth.EmailPasswordConfig{Enabled: true},
	})
	if err != nil {
		panic(err)
	}

	// sweep expired one-time tokens and sessions
	defer auth.StartCleanup(context.Background(), time.Hour)()

	mux := http.NewServeMux()
	mux.Handle("/api/auth/", auth.Handler())
	http.ListenAndServe(":8080", mux)
}
```

That's a working sign-up/sign-in server. Try it:

```bash
AUTH_SECRET=$(openssl rand -hex 32) go run .

curl -s localhost:8080/api/auth/sign-up/email \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"correct horse battery"}'
```

## It refuses to start unsafe

`New` validates the configuration and returns an error rather than
starting in an unsafe state. A missing or short `Secret`, a missing or
relative `BaseURL`, `SameSite=none` without secure cookies, or trusting
proxy headers without naming the proxies are all rejected at startup -
not discovered in production.

## Any router

The handler is a plain `http.Handler`, so it mounts on chi, echo,
gorilla, or gin (via `gin.WrapH`) the same way. If your frontend runs on
a different origin, wrap it - `auth.CORS(auth.Handler())` - and list
that origin in `TrustedOrigins`.

## Two things before production

1. **Swap the memory adapter for a real database** - see
   [Storage &amp; migrations](/guide_site/guides/storage/).
2. **Tell it about your proxy** if anything (load balancer, ingress,
   CDN) sits in front of your process - see
   [Deploying behind a proxy](/guide_site/guides/proxy/). Both defaults
   are wrong in a different direction if you skip this.
