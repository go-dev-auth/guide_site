---
title: Deploying behind a proxy
description: Rate limiting and session IPs depend on resolving the real client address. Configure proxy trust or suffer one of two failure modes.
---

Rate limiting and every recorded session IP depend on resolving the
*client's* address. If anything terminates the connection in front of
your process - an AWS ALB, nginx, Cloudflare, a Kubernetes ingress -
you must say so, because **both defaults are wrong in a different
direction**:

| Configuration | What happens |
|---|---|
| Nothing set, but running behind a proxy | Every request resolves to the proxy's address, so all clients share one rate-limit bucket. The strict rule of 3 sign-ins per 10 seconds becomes 3 per 10 seconds **for your whole fleet**, and the limiter fails closed. A self-inflicted outage. |
| `TrustProxyHeaders` with no `TrustedProxies` | `X-Forwarded-For` is client-supplied. Any caller picks its own bucket and the limit stops limiting anything. |
| `TrustProxyHeaders` + `TrustedProxies` | Correct. Forwarded headers are read only from a listed peer, and the header chain is walked right-to-left past trusted hops, so addresses a client prepended are ignored. |

So:

```go
Advanced: godevauth.AdvancedConfig{
	TrustProxyHeaders: true,
	// IPs or CIDRs of your load balancers / ingress pods.
	TrustedProxies: []string{"10.0.0.0/8", "192.168.0.0/16"},
	// Or, for a provider-specific header:
	// IPAddressHeaders: []string{"CF-Connecting-IP"},
},
```

`New` **refuses to start** if `TrustProxyHeaders` (or
`IPAddressHeaders`) is set without `TrustedProxies`. Use
`TrustedProxies: []string{"*"}` to trust any peer - that is the old,
spoofable behaviour, only safe when the network guarantees the service
is unreachable except through a proxy that overwrites the header.

The opposite mistake cannot be caught at startup, because it depends on
the traffic: the first request that arrives with a forwarded header
while proxy headers are untrusted logs an error naming the header and
the peer. If you see it in production, you are in row one of the table.

Direct-to-internet deployments need none of this - leave all three
unset.
