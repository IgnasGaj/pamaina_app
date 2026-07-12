# Pamaina

Workforce scheduling SaaS for factories, restaurants, warehouses, shops, and logistics companies operating in Lithuania. Pamaina manages employees, departments, positions, working hours, and vacations. It is intentionally **not** payroll, accounting, or ERP software.

## Tech stack

| Layer    | Choices |
|----------|---------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, shadcn/ui (Radix primitives), React Router 7, TanStack Query, Axios, React Hook Form + Zod, Zustand |
| Backend  | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT auth, bcrypt |
| Tooling  | npm workspaces monorepo, ESLint/oxlint, Vitest |

## Project structure

```
apps/
  backend/    Express API — routes → controllers → services → repositories → Prisma
  frontend/   React SPA — pages → hooks (TanStack Query) → api client → axios
```

Backend follows clean architecture: controllers only translate HTTP ↔ DTOs, services hold business rules, repositories are the only layer touching Prisma. Every request body is validated with a Zod DTO before it reaches a service.

## Getting started

Prerequisites: Node.js 20+, a running PostgreSQL instance.

```bash
npm install

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# edit apps/backend/.env — set DATABASE_URL and real JWT secrets

npm run prisma:migrate   # creates the schema in your database
npm run prisma:seed      # seeds permissions + a platform super admin

npm run dev              # backend on :4000, frontend on :5173
```

Default seeded super admin (change immediately outside local dev): `admin@pamaina.lt` / `ChangeMe123!` (overridable via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`).

## Auth & roles

Four system roles: **Super Admin** (platform-wide, no company), **Company Owner**, **Manager**, **Employee**. Permissions are granular (`employee.read`, `department.update`, ...) and attached to roles via a join table, so companies can eventually define custom roles without schema changes.

- Access tokens are short-lived JWTs (15m) carrying the user's permissions, kept **in memory only** on the frontend (never localStorage) to limit XSS blast radius.
- Refresh tokens are opaque, hashed at rest, rotated on every use, and delivered only via an httpOnly/secure cookie scoped to `/api/v1/auth`. Reuse of a rotated-out token revokes the session.
- The frontend re-establishes a session on page load with a silent `POST /auth/refresh` and transparently retries any request that comes back 401 once, via a deduplicated single-flight refresh.

## Data model

`Company → Department → Position → Employee`, with `User` (login identity) separate from `Employee` (HR record) since not every employee needs a login and not every user is an employee (e.g. Super Admin). Scheduling entities are deliberately out of scope for this phase.

## Scripts

Root-level (delegates to the relevant workspace):

```
npm run dev / dev:backend / dev:frontend
npm run build / build:backend / build:frontend
npm run typecheck / lint / test
npm run prisma:generate / prisma:migrate / prisma:migrate:deploy / prisma:seed / prisma:studio
```
