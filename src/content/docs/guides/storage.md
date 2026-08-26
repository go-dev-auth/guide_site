---
title: Storage & migrations
description: Adapters for Postgres, MySQL, SQLite, MongoDB and memory - all pinned by one conformance suite that runs against real servers in CI.
---

## Adapters

| Adapter | Import | Notes |
|---|---|---|
| In-memory | `storage/memory` | Tests, examples, single-process. Enforces unique constraints. |
| SQL | `storage/sqlstore` | PostgreSQL, MySQL, SQLite via `database/sql`. Bring your own driver. |
| MongoDB | `storage/mongostore` | Official `mongo-go-driver`. Separate Go module. |

All adapters are written against the same conformance suite
(`storage/storagetest`), which pins the semantics the auth core depends
on. What has actually been executed: **SQLite** - full suite plus a
complete HTTP auth flow in CI on every push. **PostgreSQL** - running in
production, plus the same CI suite against a real server. **MySQL** -
the same CI job against a real MySQL 8; CI-verified, no field mileage
yet. **MongoDB** - exercised against a wire-protocol test double; beta.

## Using a real database

```go
import (
	"database/sql"

	"github.com/go-dev-auth/go-dev-auth/storage/sqlstore"
	_ "github.com/jackc/pgx/v5/stdlib" // bring your own driver
)

db, _ := sql.Open("pgx", os.Getenv("DATABASE_URL"))
store := sqlstore.New(db, sqlstore.Postgres, nil)

auth, _ := godevauth.New(godevauth.Config{
	Secret:   os.Getenv("AUTH_SECRET"),
	Database: store,
	// ...
})

// pick up the plugin tables *and columns*, then apply them
store.SetSchema(auth.Schema())
if err := store.Migrate(context.Background()); err != nil { /* ... */ }
```

## Migrations do columns, not just tables

Plugins add **columns to tables you already have**: `admin` adds
`role`, `banned`, `banReason`, `banExpires` to `user`; `twofactor` adds
`twoFactorEnabled`; `organization` adds `activeOrganizationId` to
`session`. `CREATE TABLE IF NOT EXISTS` does nothing for an existing
table, so column-level migration is not optional once the database has
data.

| | |
|---|---|
| `store.Migrate(ctx)` | Creates missing tables and indexes, **and** adds missing columns. Idempotent - call on every boot. |
| `store.MigrationSQL()` | Full create-from-nothing DDL for provisioning by hand. |
| `store.PendingMigrationSQL(ctx)` | Introspects the live database, returns only what it lacks. |
| `store.CheckSchema(ctx)` | Reports drift as an error without changing anything. |

Added columns are always nullable (existing rows have no value for
them), and `Migrate` needs DDL rights. If your app's database role
doesn't have them, migrate in a deploy step and set
`Advanced.DisableAutoMigrate` plus `Advanced.VerifySchema` so a missed
migration fails at startup with a message naming the missing columns.

## MongoDB

```go
import (
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"github.com/go-dev-auth/go-dev-auth/storage/mongostore"
)

client, err := mongo.Connect(options.Client().ApplyURI(os.Getenv("MONGODB_URI")))
store := mongostore.New(client.Database("myapp"))
```

`New` creates the indexes the schema implies, including unique ones -
on MongoDB that step is load-bearing, because collections are created
lazily and an instance without them silently races on "does this email
exist?". The adapter also rejects composite values where MongoDB would
read them as operators (the NoSQL-injection shape) and reports duplicate
keys as `storage.ErrUniqueViolation`.

## Writing your own adapter

Run the conformance suite against it:

```go
func TestConformance(t *testing.T) {
	storagetest.Run(t, func(t *testing.T) (storage.Adapter, func()) {
		return myAdapter(storagetest.Schema()), func() {}
	})
}
```
