---
title: Security model
description: The design answers to named attackers, and every claim maps to a test. This page is the summary; the full model lives in the repository.
---

The full threat model - the attackers the design answers to, and a
claim-to-test table - lives in
[docs/security-model.md](https://github.com/go-dev-auth/go-dev-auth/blob/main/docs/security-model.md).
The short version:

**Passwords.** scrypt (N=16384, r=16, p=1), better-auth's `salt:key`
hex format. Each hash costs ~50 ms of CPU and ~32 MiB of scratch by
design; the hasher bounds concurrency and pools buffers so a sign-in
burst cannot exhaust memory.

**Rate limiting is on by default** (fail-closed), because the sign-in
endpoint is expensive by construction. Disable it only when a gateway
already throttles these paths; supply `RateLimit.Storage` when running
more than one instance.

**Sessions.** 32-byte random tokens, HMAC-signed cookies with domain
separation and `__Secure-` prefixes on HTTPS. Raw tokens never appear
in listings.

**One-time tokens** (password reset, email verification, magic links,
deletion, OAuth state) are stored as SHA-256 digests and consumed
atomically - database read access yields no usable links.

**OAuth.** PKCE (S256); state pinned to the browser and the issuing
provider, single-use, expiring. Automatic account linking requires a
provider-verified email *and* a trusted provider.

**CSRF.** State-changing requests are origin-checked against `BaseURL`
+ `TrustedOrigins`, falling back to `Sec-Fetch-Site` when no
Origin/Referer is present.

**Sign-in guards.** Every sign-in path funnels through one gate, so
two-factor and bans cannot be bypassed by choosing another method.

**Secrets at rest.** AES-256-GCM with keys derived from `Secret`.
Encryption failure is an error, never a silent plaintext write;
decryption failure is an error, never the ciphertext returned. Each
ciphertext is bound to its model, record and field, so write access to
the database cannot be turned into a read oracle.

**Reporting.** See
[SECURITY.md](https://github.com/go-dev-auth/go-dev-auth/blob/main/.github/SECURITY.md)
for the disclosure contact.
