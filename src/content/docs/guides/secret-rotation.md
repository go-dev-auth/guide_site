---
title: Rotating the secret
description: Config.Secret can be rotated without locking users out - a three-step deploy with PreviousSecrets and ReencryptSecrets.
---

`Config.Secret` derives the key that encrypts values at rest (TOTP
secrets, backup codes, JWT private keys, and OAuth tokens when
`Account.EncryptOAuthTokens` is set). Stored values are versioned and
tagged with a key identifier, so the secret can be rotated without a
lockout:

```go
// 1. Deploy: new secret current, old one still readable.
Secret:          os.Getenv("AUTH_SECRET"),      // the new value
PreviousSecrets: []string{os.Getenv("AUTH_SECRET_OLD")},
```

```go
// 2. Migrate. Safe against a live instance; re-run until Done.
result, err := auth.ReencryptSecrets(ctx)
// result.Rewritten  - values moved to the current key and format
// result.Unreadable - values no key can read; investigate before step 3
// result.Skipped    - rows a concurrent write changed mid-pass; re-run
// result.Done()     - nothing left to do
```

```go
// 3. Deploy again with PreviousSecrets empty. Once step 2 reports
//    Done, also set:
RequireBoundCiphertexts: true,
```

`ReencryptSecrets` walks each table in batches, every write is a
compare-and-set on the ciphertext it read (a value refreshed mid-pass
is skipped, never reverted), and it is idempotent.

## Why `RequireBoundCiphertexts` matters

Ciphertexts in the current format are **bound to where they are
stored** - model, record id and field name are authenticated alongside
the value - so a value copied between encrypted columns does not
decrypt, and database write access cannot become a read oracle. Until
`RequireBoundCiphertexts` is set, older unbound formats are still
accepted on read for upgrade compatibility. Upgrade, migrate to
`Done()`, then turn it on.

## Failure behaviour is loud, not lossy

Skip step 1 and the library will not guess: an unreadable TOTP secret
is a `500 TWO_FACTOR_SECRET_UNREADABLE`, not a "wrong code"; an
unreadable OAuth token is a `500 TOKEN_DECRYPTION_FAILED`, not a blob
forwarded to the provider; and `/jwks` keeps publishing every public
key so tokens in circulation stay verifiable while you fix the config.

Note: cookie and token *signatures* are not versioned - rotating
`Secret` signs existing users out regardless of `PreviousSecrets`.
