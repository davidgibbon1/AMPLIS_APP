You’ll build this as a **typed, modular monolith** first, with a clear path to evolve into “everything Amplis” (PM, asset management, RAG, assistant) without chaos.

I’ll give you:

1. **Programming model** (how to think about structure)
2. **Tech stack (end-to-end)**
3. **Monorepo / folder structure** (Cursor-friendly)
4. **Key backend modules & APIs**
5. **RAG & assistant architecture**
6. **Logging, security, auth**
7. **Dev workflow & testing**

You can drop this straight into Cursor as a “requirements / architecture doc” and start scaffolding.

---

## 1. Programming model (how we structure the app)

You want: **speed now + long-term sanity**.

### Overall style: modular monolith + FP-leaning services

* **Domain-first, modular monolith**:

  * Each domain (projects, deliverables, allocations, timesheets, billing, ai_assistant, asset_management) is its own module.
  * Each module has:

    * `schema` (Zod + Prisma models),
    * `service` functions (pure-ish TypeScript),
    * `router` (tRPC endpoint),
    * UI components/hooks.

* **In code:**

  * **Functional style** inside services:

    * Input = plain typed params
    * Output = `Result` objects (success/error) or thrown typed errors.
    * No hidden state, no reaching directly into Express/Next context.
  * Mild **OO** at the boundaries:

    * For things like `ProjectHealthCalculator` or `InvoiceGenerator`, you *can* wrap logic in classes if it helps encapsulate config, but default is FP.

* **React/Next side:**

  * Use **functional React** + hooks.
  * Server state = **TanStack Query**, mutations via tRPC.
  * Local UI state = **Zustand** for small global bits (filters, sidebar, etc.) + normal `useState/useReducer` as needed.

This combo gives you:

* Domain logic you can unit-test easily.
* Strict typing across front/back (tRPC).
* Easy refactor later into microservices if you outgrow the monolith.

---

## 2. Tech stack (full)

### Frontend

* **Framework**: Next.js (App Router)
* **Language**: TypeScript (strict)
* **Styling**:

  * Tailwind CSS
  * shadcn/ui (built on Radix) for consistent UI primitives
* **State / Data fetching**:

  * TanStack Query for server state
  * Zustand for small global state (filters, layout stuff)
* **Forms & validation**:

  * React Hook Form
  * Zod schemas shared with backend
* **Charts & reporting**:

  * Recharts (or VisX) for utilisation graphs, burndown, margin charts
* **Component design**:

  * “Composable dashboards” – cards, filters, table components, “metric pill” components that you can reuse across project / portfolio / person views.

### Backend

* **Runtime**: Node.js
* **API layer**: tRPC inside Next.js (route handlers in `/app/api/trpc`)
* **Language**: TypeScript
* **ORM / DB**:

  * PostgreSQL (Supabase / Neon in dev, RDS/CloudSQL later)
  * Prisma ORM (+ Prisma Migrate)
* **Background jobs** (for AI & heavy tasks):

  * Node worker using something like **BullMQ** or **Inngest** (queue based on Redis) for:

    * Chunking + embeddings
    * Heavy report generation
    * Scheduled health checks (e.g. nightly project risk scoring)

### AI / RAG

* **LLM provider**: OpenAI (Chat Completions + Embeddings)
* **Embeddings**: `text-embedding-3-large` (or current best)
* **Vector storage**:

  * **pgvector** extension on PostgreSQL
  * OR external vector DB later (Pinecone/Qdrant) — design so it’s pluggable.
* **RAG pipeline**:

  * Chunkers: for PDFs, PPTX, DOCX, Markdown, email text.
  * Store chunks in: `document_sources` + `document_chunks` tables.
  * Retrieval: hybrid of similarity + metadata filters (org, client, project, deliverable, tag).

### Auth & Multi-tenant

* **Auth provider**:

  * Use **Clerk** or **Auth.js** (if you want to keep dependencies minimal, use Auth.js).
* **Multi-tenancy**:

  * `orgs` table; every row in core tables (`projects`, `people`, `deliverables`, etc.) has `org_id`.
  * Users can belong to 1+ orgs; RBAC by role per org.

### Infra / DevOps

* **Package manager**: `pnpm`
* **Monorepo**: Turborepo
* **Hosting**:

  * Vercel (web + API) to start
  * Supabase/Neon for Postgres
  * Upstash Redis for queues / rate limiting
* **CI/CD**:

  * GitHub Actions
  * Pipelines:

    * lint + test
    * build
    * db migration dry-run
* **Error tracking**: Sentry
* **Logging**: pino (or console + Sentry breadcrumbs initially)

---

## 3. Monorepo + folder structure (Cursor-friendly)

### High-level

```txt
amplis/
  apps/
    web/                # Next.js app (frontend + tRPC backend)
      app/
        (marketing)/    # public website if you want it here
        (dashboard)/    # authenticated app shell
          layout.tsx
          page.tsx
          projects/
          people/
          billing/
          ai-assistant/
        api/
          trpc/
            [trpc]/route.ts    # tRPC HTTP handler
      components/
        ui/            # shadcn components
        layout/        # nav, sidebar, app shell
        charts/        # generic chart wrappers
        tables/        # generic tables
        forms/         # form components + field wrappers
        project/       # feature-specific UI
        deliverable/
        allocation/
      server/
        trpc/
          context.ts
          routers/
            index.ts
            project.ts
            deliverable.ts
            allocation.ts
            timesheet.ts
            billing.ts
            ai.ts
            user.ts
        domain/
          project/
            project.schema.ts   # Zod + TS types
            project.service.ts  # pure domain functions
            project.repo.ts     # Prisma queries
          deliverable/
          allocation/
          timesheet/
          billing/
          ai/
            rag.service.ts
            assistant.service.ts
      lib/
        auth/
          auth.ts        # Auth.js / Clerk helpers
          rbac.ts
        db/
          client.ts      # Prisma client
        validation/
          index.ts       # re-export Zod schemas
        dto/
          index.ts       # TS interfaces for API layers
        utils/
          dates.ts
          money.ts
          logging.ts
      tests/
        unit/
        integration/
      prisma/
        schema.prisma
        migrations/

  packages/
    ui/               # shared UI components (if you add other apps later)
    config/
      eslint/
      tsconfig/
      tailwind/

  infra/
    docker/
    scripts/
      dev-seed.ts

  .github/workflows/
    ci.yml
```

This keeps:

* **Domain logic** in `server/domain/*`.
* **API wiring** in `server/trpc/routers/*`.
* **UI components** in `components/*`, each feature folder.
* **Shared types/validation** in `lib/validation` + Zod.

---

## 4. Core backend modules & APIs

Design each domain module with:

* `*.schema.ts` – Zod + TS types.
* `*.repo.ts` – Prisma queries only.
* `*.service.ts` – business rules, pure as possible.
* `router/*.ts` – tRPC procedures that call services.

### Example: Projects / Deliverables

**`project.schema.ts`**

* Zod schemas for:

  * `ProjectCreateInput`
  * `ProjectUpdateInput`
  * `DeliverableCreateInput`
  * etc.
* Derived types: `Project`, `Deliverable` etc.

**`project.repo.ts`**

* Prisma-based functions:

  * `findProjectById(orgId, projectId)`
  * `listProjects(orgId, filters)`
  * `createProject(data)`
  * etc.

**`project.service.ts`**

* Business logic:

  * `createProjectWithDeliverables(...)`
  * `calculateProjectMargin(projectId)`
  * `getProjectHealth(projectId)` → { margin, budgetVsActual, riskScore }
  * `updateDeliverableProgress(deliverableId, percentComplete)`
  * `getBillableDeliverables(projectId, rules)`

**`routers/project.ts` (tRPC)**

* `project.list`
* `project.get`
* `project.create`
* `project.update`
* `project.health`

All procedures use Zod for input validation, return typed responses, and enforce org / RBAC checks via context.

### Timesheets & Allocations

* **Timesheet**:

  * `logTime({ personId, projectId, deliverableId, date, hours, notes })`
  * On insert, service updates:

    * `actual_hours` and `actual_cost` on deliverable & project.
* **Allocation**:

  * `createAllocation({ personId, projectId, deliverableId, plannedHours, timeWindow })`
  * Weekly utilisation calculation:

    * service: `getUtilisationForPeriod(orgId, from, to)`.
  * Over-utilisation detection:

    * `utilisation > fte_capacity_per_week` → flag.

### Billing / Invoices

* `billing.service.ts`:

  * `getBillableItems(projectId, rules)`
  * `generateInvoiceDraft({ projectId, deliverableIds })`
  * `markInvoiceStatus(invoiceId, status)`

These map directly to your “bill by deliverable” UX.

---

## 5. Assistant & RAG architecture

This is where Amplis becomes uniquely Amplis.

### Data model for knowledge / RAG

**Tables:**

* `document_sources`

  * `id`
  * `org_id`
  * `project_id` (nullable – some docs cross projects)
  * `deliverable_id` (nullable)
  * `title`
  * `type` (pptx, pdf, word, email, notebook, meeting_notes, asset_registry)
  * `storage_path` or external URL
  * `created_by`, `created_at`

* `document_chunks`

  * `id`
  * `source_id`
  * `chunk_index`
  * `text`
  * `metadata` (JSONB – section headers, page numbers, tags)
  * `embedding` (vector)
  * `created_at`

**Ingestion flow (worker app or background job):**

1. User uploads or generates a doc:

   * Output from your “AI PPT editor”,
   * Asset management reports,
   * Meeting notes, etc.
2. Background job:

   * Extract text (use `mammoth`, `pdf-parse`, `pptx-parser`, etc.).
   * Chunk text (semantic or fixed tokens).
   * Call OpenAI embedding API.
   * Insert rows into `document_chunks`.

### Retrieval / Assistant

**User flow in the app:**

* User opens **“Amplis Assistant”** inside a project or global context.
* Context objects:

  * Current org, user role,
  * Optional `projectId` and `deliverableId`,
  * Optional “view mode” (Project health / Asset management / Generic QA).

**Backend flow (`ai.assistant` tRPC router):**

1. Receive question + context (projectId, etc.).
2. Build search query:

   * Filter by `org_id`
   * If `projectId` given, filter to that.
3. Retrieve relevant chunks from `document_chunks` via vector similarity.
4. Build system prompt:

   * Include:

     * summarised project health (via `project.service.getProjectHealth`),
     * top retrieved chunks as context.
   * Tools the model can call:

     * `getProjectHealth`
     * `listDeliverables`
     * `getBillableItems`
     * `draftClientUpdate`
5. Call OpenAI Chat API with:

   * Tools definitions mapping to tRPC endpoints.
   * RAG context as `context` or within system prompt.
6. Return the assistant response + references (source ids) for UI to show “this answer is based on…”

This design makes your assistant the **front door to everything**:

* Project reporting,
* Asset management insights,
* Auto-PPT generation (assistant can call `generateReportDeck` tool which returns PPTX URL).

---

## 6. Logging, security, auth (practical setup)

### Auth + RBAC

* Auth via **Auth.js** (or Clerk if you want zero auth boilerplate).
* Core tables:

  * `users`
  * `orgs`
  * `user_org_roles`:

    * `role` ∈ { owner, partner, manager, ic, admin }
* Every tRPC context includes `orgId`, `userId`, and `roles`.
* Helper:

```ts
export function requireRole(ctx, allowed: Role[]) {
  if (!allowed.includes(ctx.role)) throw new TRPCError({ code: 'FORBIDDEN' });
}
```

Use that inside routers.

### Security

* **Input validation** everywhere via Zod.
* **Org scoping**: all queries include `orgId` from context – never from client.
* **Rate limiting**:

  * Upstash Redis for simple per-user/per-IP limits on:

    * auth endpoints
    * AI/assistant endpoints.
* **Secrets management**:

  * `.env` for local
  * Managed environment variables for prod (Vercel / Doppler).
* **File uploads**:

  * Use signed URLs (S3 / R2 / Supabase storage),
  * Validate MIME types and sizes server-side,
  * Virus scanning if/when needed (later stage).

### Logging & observability

* Use **pino** (or `console.log` + Sentry when starting).
* Log structure:

  * `timestamp`
  * `userId`
  * `orgId`
  * `routeName`
  * `duration_ms`
  * `result` (success/fail)
* **Audit logging** for critical domain events:

  * `audit_log` table:

    * `id`
    * `org_id`
    * `actor_id`
    * `action` (e.g. `PROJECT_CREATED`, `INVOICE_SENT`)
    * `entity_type` (project, deliverable, invoice)
    * `entity_id`
    * `metadata` (JSONB)
    * `created_at`

Use this for “what happened when and by whom” – which will matter in consulting environments.

---

## 7. Dev workflow & testing (to keep things *non-vibecody*)

### Dev workflow

* **Branching**:

  * `main` protected, `dev` for integration, feature branches.
* **Cursor / AI pair programming**:

  * Drop this doc into `/docs/architecture.md`.
  * Keep per-module spec docs:

    * `/docs/project-module.md`
    * `/docs/ai-assistant.md`
* **Scripts** (`package.json` in root):

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "prisma:migrate": "pnpm --filter web prisma migrate dev",
    "prisma:generate": "pnpm --filter web prisma generate"
  }
}
```

### Testing

* **Unit tests** (Jest / Vitest) in `apps/web/tests/unit`:

  * Target `*.service.ts` files:

    * `project.service.test.ts`
    * `billing.service.test.ts`
* **Integration tests**:

  * Spin up a test Postgres (e.g. via Docker).
  * Run tRPC procedures end-to-end.
* **E2E tests**:

  * Playwright for key flows:

    * login
    * create project + deliverables
    * allocate people
    * log time
    * generate invoice draft
    * run assistant question

---

If you want, you can now:

* Ask me to **generate a concrete `schema.prisma`** for:

  * `orgs, users, projects, deliverables, allocations, timesheets, invoices, document_sources, document_chunks`
* Or ask for a **step-by-step implementation plan** (week-by-week / feature-by-feature) in the same style.
