## Dockerized Neon Setup

This repository now supports a dual-database workflow:

- **Development** uses [Neon Local](https://neon.com/docs/local/neon-local) running inside Docker so every developer can spin up ephemeral branches on demand.
- **Production** connects straight to your managed Neon Cloud branch via secrets provided at deploy time.

### What's Included

- `Dockerfile` with dedicated `dev` and `prod` build targets.
- `docker-compose.dev.yml` to run the API plus the Neon Local proxy.
- `docker-compose.prod.yml` to run the API against the remote serverless Neon branch.
- `env.development.example` and `env.production.example` you can copy to `.env.development` / `.env.production`.
- Updated `src/config/database.js` that automatically switches transport settings when talking to Neon Local.

### Prerequisites

1. Docker Desktop 4.28+ (Compose v2.24 or newer).
2. A Neon project API key with permission to create branches.
3. Your Neon project ID, default database name, and parent branch name (often `main`).

### Configure Environment Files

Copy the provided examples and fill in your values:

```bash
cp env.development.example .env.development
cp env.production.example .env.production
```

Key variables:

- `DATABASE_URL` – connection string the app and Drizzle use. For dev it should point at `postgres://…@neon-local:5432/...`. For prod it must be the Neon Cloud URL (typically ends with `neon.tech`).
- `NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_DATABASE`, `NEON_PARENT_BRANCH` – used by the Neon Local proxy to request fresh ephemeral branches.
- `NEON_LOCAL_PROXY_URL` – HTTP endpoint the SDK hits when `DATABASE_URL` references `neon-local`. Defaults to `http://neon-local:5432/sql`.
- `NEON_LOCAL_CREATE_BRANCH=true` – instructs the proxy to create short-lived branches for each container instance.

> **Note:** `.env.*` files are intentionally ignored by git. Keep your real secrets there and never commit them.

### Run the Stack in Development

```bash
docker compose -f docker-compose.dev.yml --env-file .env.development up --build
```

What happens:

- `neon-local` container authenticates with your Neon API key, forks an ephemeral branch off `NEON_PARENT_BRANCH`, and proxies it on the Compose network as `neon-local:5432` (exposed on host `localhost:5433` if you want to connect with `psql`).
- `api` container is built with the `dev` target, mounts your working tree, runs `npm run dev`, and connects to the proxy via `DATABASE_URL`.
- `src/config/database.js` detects `NEON_LOCAL_PROXY_URL`, disables secure websockets, and talks to the proxy over plain HTTP per Neon Local requirements.

### Run the Stack for Production

1. Ensure `.env.production` contains the managed Neon Cloud URL (plus `sslmode=require`).
2. Build and start the production stack:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
   ```
3. Only the `api` service runs; it hits Neon Cloud directly and **no** Neon Local proxy is started. Inject real secrets through your orchestrator (`--env-file`, Docker secrets, or your CI/CD platform).

### Connecting the App Outside Docker

If you still run `npm run dev` on the host, point `DATABASE_URL` to `postgres://…@localhost:5433/...` (the host port exposed by `neon-local`) and keep `NEON_LOCAL_PROXY_URL=http://localhost:5433/sql`.

### Database Tooling & Migrations

Drizzle CLI reads the same `DATABASE_URL`, so you can run migrations inside the `api` container or on the host as long as the relevant `.env.*` file is exported:

```bash
docker compose -f docker-compose.dev.yml exec api npm run db:migrate
```

### Switching Environments

- The Docker build target (`dev` vs `prod`) sets `NODE_ENV`.
- Compose chooses which `.env.*` file to load, so `DATABASE_URL` automatically points to either Neon Local or Neon Cloud without code changes.
- No secrets are baked into images; everything flows through environment variables.

Refer to Neon’s docs for advanced Neon Local flags (custom branch names, retention policies, etc.). Update `.env.development` accordingly and restart the stack to apply the new behavior.
