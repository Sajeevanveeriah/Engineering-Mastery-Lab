# Future Supabase / Vercel Integration Roadmap

The first release is intentionally backend-free. This document describes how
to add cloud features without breaking the local-first experience.

## Guiding principles

- Local-first stays: the app must keep working offline with `localStorage`.
- The versioned `ProgressState` schema is the sync contract.
- No secrets in client code: only the Supabase **anon/publishable** key is
  ever shipped to the browser; row-level security (RLS) protects data.

## Phase 1: Auth + cloud progress (Supabase)

1. Create a Supabase project; enable email (magic link) auth.
2. Schema:
   ```sql
   create table progress (
     user_id uuid references auth.users primary key,
     state jsonb not null,
     version int not null default 1,
     updated_at timestamptz not null default now()
   );
   alter table progress enable row level security;
   create policy "own progress" on progress
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```
3. Client: add a `ProgressStore` interface with two implementations:
   `LocalStore` (current behaviour) and `SupabaseStore`. `ProgressContext`
   picks Supabase when a session exists, falling back to local.
4. Sync strategy: last-write-wins on `updated_at`, with the JSON export as the
   user-facing conflict escape hatch.

## Phase 2: Saved results and artefacts

- Tables for challenge results and Practice Lab artefacts (FMEA, traceability,
  FAT, decisions), enabling history and shareable read-only links.
- Storage bucket for uploaded evidence (screenshots, PDFs) with RLS.

## Phase 3: Hosting options

- **GitHub Pages (current):** static, free, `base` path configured.
- **Vercel:** zero-config Vite deploys, preview URLs per PR, and serverless
  functions if an AI-tutor proxy is added later (keeps any LLM API key
  server-side; the current release uses copyable prompt cards only).

## Phase 4: More simulations

Candidates in priority order: Bode/root-locus explorer, three-phase power and
motor torque-speed curves, RTOS scheduling visualiser, kinematic arm (2-link
IK), Kalman filter demo on the existing odometry noise, OPC-UA style tag
browser mock for SCADA.

## Phase 5: Portfolio export

Single-click export of a portfolio pack: selected artefacts + skill matrix +
challenge history rendered to a printable HTML/PDF report.
