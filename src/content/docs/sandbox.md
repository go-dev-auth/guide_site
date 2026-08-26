---
title: Sandbox
description: Try go-dev-auth without installing anything - in the Go Playground, in Codespaces, or by running the example app.
---

go-dev-auth is a server library, so "try it in the browser" means one
of three things, cheapest first.

## 1. Go Playground

Because the core has zero dependencies and ships an in-memory adapter,
real flows run in the [Go Playground](https://go.dev/play/) - no
server socket needed, `httptest` drives the handler directly:

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"

	godevauth "github.com/go-dev-auth/go-dev-auth"
	"github.com/go-dev-auth/go-dev-auth/storage/memory"
)

func main() {
	auth, err := godevauth.New(godevauth.Config{
		// BaseURL is configuration, not a connection: nothing listens on
		// this address in the Playground. It is the URL the library uses
		// to build links and cookie rules; httptest below calls the
		// handler directly in memory, so no server or port is needed.
		BaseURL:          "http://localhost:8080",
		Secret:           "0123456789abcdef0123456789abcdef", // demo only
		Database:         memory.New(),
		EmailAndPassword: godevauth.EmailPasswordConfig{Enabled: true},
	})
	if err != nil {
		panic(err)
	}

	// Sign up
	req := httptest.NewRequest(http.MethodPost, "/api/auth/sign-up/email",
		strings.NewReader(`{"email":"you@example.com","password":"correct horse battery"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	auth.Handler().ServeHTTP(rec, req)
	fmt.Println("sign-up:", rec.Code, rec.Body.String())

	// Sign in
	req = httptest.NewRequest(http.MethodPost, "/api/auth/sign-in/email",
		strings.NewReader(`{"email":"you@example.com","password":"correct horse battery"}`))
	req.Header.Set("Content-Type", "application/json")
	rec = httptest.NewRecorder()
	auth.Handler().ServeHTTP(rec, req)
	fmt.Println("sign-in:", rec.Code)
	cookies := rec.Result().Cookies()
	for _, c := range cookies {
		fmt.Println("cookie:", c.Name)
	}

	// Who am I? - the session cookie authenticates the request
	req = httptest.NewRequest(http.MethodGet, "/api/auth/get-session", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec = httptest.NewRecorder()
	auth.Handler().ServeHTTP(rec, req)
	fmt.Println("get-session:", rec.Code, rec.Body.String()[:60], "...")

	// Sign out - the session is revoked server-side
	req = httptest.NewRequest(http.MethodPost, "/api/auth/sign-out", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec = httptest.NewRecorder()
	auth.Handler().ServeHTTP(rec, req)
	fmt.Println("sign-out:", rec.Code)

	// The revoked cookie no longer authenticates
	req = httptest.NewRequest(http.MethodGet, "/api/auth/get-session", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec = httptest.NewRecorder()
	auth.Handler().ServeHTTP(rec, req)
	fmt.Println("after sign-out:", rec.Code, rec.Body.String())
}
```

Paste it into the Playground and press Run.

## Where is the data?

`memory.New()` stores everything - users, hashed passwords, sessions -
in the program's RAM, in plain Go maps inside your process. Nothing is
written to disk and nothing leaves the machine. When the program exits
(or the Playground run ends), it is all gone. That is exactly what it
is for: tests, examples, and toy servers.

The moment you want data to survive a restart, swap in a real adapter -
same config field, nothing else changes:

| Where | Adapter |
|---|---|
| This page's Playground demo | `memory.New()` - RAM, gone at exit |
| `examples/basic` | `memory.New()` - RAM, gone when you stop the server |
| `examples/fullapp` | SQLite file (`fullapp.db`) - survives restarts |
| Production | `sqlstore` (Postgres/MySQL/SQLite) or `mongostore` - see [Storage &amp; migrations](/guides/storage/) |

## 2. GitHub Codespaces

Open the repository in a full cloud dev environment - one click, no
local Go install:

[github.com/go-dev-auth/go-dev-auth → Code → Codespaces](https://github.com/go-dev-auth/go-dev-auth)

Then inside the terminal:

```bash
go run ./examples/basic
```

## 3. The full example app

[`examples/fullapp`](https://github.com/go-dev-auth/go-dev-auth/tree/main/examples/fullapp)
is a feature tour in one file - password and passwordless sign-in,
two-factor auth, password reset, and session management, persisted to
SQLite:

```bash
git clone https://github.com/go-dev-auth/go-dev-auth
cd go-dev-auth/examples/fullapp
go run .
```

Open `http://localhost:8080` and click through: register, sign in with
a magic link (the "email" prints to your terminal), enable two-factor
from the dashboard and sign in again with a code from your
authenticator app, list your sessions, sign out everywhere else, and
run a password reset end to end.
