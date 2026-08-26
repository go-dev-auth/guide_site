---
title: API endpoints
description: Every route, under Config.BasePath (default /api/auth), matching better-auth's route names.
---

All endpoints live under `Config.BasePath` (default `/api/auth`) and
match better-auth's route names.

| Area | Endpoints |
|---|---|
| Email &amp; password | `POST /sign-up/email`, `POST /sign-in/email`, `POST /forget-password`, `POST /reset-password`, `GET /reset-password/:token`, `POST /change-password`, `POST /set-password` |
| Email verification | `POST /send-verification-email`, `GET /verify-email` |
| Session | `GET /get-session`, `POST /sign-out`, `GET /list-sessions`, `POST /revoke-session`, `POST /revoke-sessions`, `POST /revoke-other-sessions` |
| Social | `POST /sign-in/social`, `GET\|POST /callback/:provider`, `POST /link-social`, `POST /unlink-account`, `GET /list-accounts`, `POST /refresh-token`, `GET /account-info` |
| User | `POST /update-user`, `POST /change-email`, `POST /delete-user`, `GET\|POST /delete-user/callback` |
| Two-factor | `POST /two-factor/{enable,disable,get-totp-uri,verify-totp,send-otp,verify-otp,generate-backup-codes,verify-backup-code}` |
| Magic link | `POST /sign-in/magic-link`, `GET /magic-link/verify` |
| Organization | `POST /organization/{create,update,delete,set-active,invite-member,accept-invitation,reject-invitation,cancel-invitation,remove-member,update-member-role,leave,check-slug,create-team,remove-team}`, `GET /organization/{list,get-full-organization,get-invitation,list-invitations,get-active-member,list-teams}` |
| Admin | `POST /admin/{create-user,set-role,set-user-password,update-user,ban-user,unban-user,impersonate-user,stop-impersonating,list-user-sessions,revoke-user-session,revoke-user-sessions,remove-user}`, `GET /admin/list-users` |
| API keys | `POST /api-key/{create,update,delete,verify}`, `GET /api-key/{get,list}` |
| JWT | `GET /token`, `GET /jwks`, `GET /.well-known/jwks.json` |

Errors are returned as `{"code": "USER_ALREADY_EXISTS", "message": "..."}`
with matching HTTP status codes. A known path with the wrong method
returns `405` with an `Allow` header.
