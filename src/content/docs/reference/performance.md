---
title: Performance & cost
description: What the library adds to a request, and where sign-in cost actually goes.
---

Measured on a 4-core arm64 container against the in-memory adapter -
an honest measure of the library's own request path, and a poor proxy
for production latency where a database round-trip dominates. Read as
"what the library adds", not "what a sign-in costs".

| Operation | Cost |
|---|---|
| Session validation (cookie → user) | ~0.6 µs parallel, 21 allocs |
| Full HTTP request through the router | ~4 µs, 47 allocs |
| Session lookup, 10k rows (memory adapter) | ~0.5 µs (indexed) |
| Password hash / verify | ~51 ms, 21 KB |

Where the money goes, in order:

**1. Password hashing dominates CPU.** ~51 ms per sign-in ≈
`sign-ins/sec ÷ 20` CPU cores. This is deliberate - it's what makes
stolen hashes expensive to crack - so the lever is to hash *less
often*, not cheaper: sessions last 7 days by default.

**2. Database round trips dominate everything else.** Two queries per
authenticated request (~1 ms each on a managed database). The session
cookie cache makes that zero - see
[Sessions](/guides/sessions/) for what it trades.

**3. Memory under a sign-in burst is bounded.** Each in-flight hash
needs 32 MiB of scratch, so concurrency is capped at `GOMAXPROCS` and
buffers are pooled: peak transient memory is `GOMAXPROCS × 32 MiB` no
matter how many requests arrive. Requests that can't get a slot within
3 s are shed with `503 SERVICE_BUSY` instead of queueing into a hang.
