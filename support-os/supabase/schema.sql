-- KOVA Support OS — database schema (Gate 2)
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh
-- project. Single-operator model: every row is owned by exactly one
-- auth.users row and RLS scopes every table to owner_id = auth.uid() —
-- there is no sharing/household concept, unlike the sibling Family Wizard
-- schema this was modelled after.
--
-- Scope: Gate 2 covers auth + leads/clients/engagements/calendar/sessions/
-- notes persistence, matching the blueprint's own Gate 2 pass criteria.
-- Money (price_items/invoices/payments), documents/credentials and
-- incidents stay on Gate 1's synthetic in-memory data until Gates 3-4.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Operator profile: one row per operator account.
-- ---------------------------------------------------------------------------
create table if not exists operator_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  trading_name text not null default 'KOVA Support',
  abn text,
  weekly_gross_target_cents bigint not null default 150000 check (weekly_gross_target_cents >= 0),
  max_travel_minutes_per_day integer not null default 90 check (max_travel_minutes_per_day >= 0),
  privacy_screen_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Organisations: registered providers, plan managers, coordinators, etc.
-- ---------------------------------------------------------------------------
create table if not exists organisations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  legal_name text not null,
  trading_name text,
  organisation_type text not null check (organisation_type in ('aged_provider', 'plan_manager', 'coordinator', 'referral', 'other')),
  abn text,
  registration_verified_at timestamptz,
  payment_terms_days integer,
  contact_phone text,
  contact_email text,
  notes text,
  status text not null default 'prospect' check (status in ('prospect', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients: active/past engagements. Created before `contacts`/`leads` which
-- reference it, and before `engagements` which it is referenced by.
-- ---------------------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null,
  preferred_name text,
  pronouns_optional text,
  suburb text not null,
  funding_lane text not null check (funding_lane in ('support_at_home', 'ndis', 'private_pay', 'premium_private')),
  active_status text not null default 'active' check (active_status in ('active', 'paused', 'ended')),
  responsible_org_id uuid references organisations(id) on delete set null,
  contracted_payer_id uuid,
  contracted_payer_label text not null default 'To be confirmed',
  -- support_brief: { approvedActivities: string[], excludedActivities: string[], instructions?, emergencyInstruction? }
  support_brief jsonb not null default '{"approvedActivities":[],"excludedActivities":[]}'::jsonb,
  last_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contacts: minimum-necessary contact records, tagged by role.
-- ---------------------------------------------------------------------------
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  organisation_id uuid references organisations(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  preferred_name text,
  role text not null check (role in ('participant', 'authorised_representative', 'provider_contact', 'plan_manager', 'emergency_contact', 'other')),
  phone text,
  email text,
  preferred_contact text check (preferred_contact in ('phone', 'email', 'sms')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Leads: the pipeline. `converted_client_id` links to the client created on
-- conversion; `assigned_org_id` is used for provider-prospect leads.
-- ---------------------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('ndis_participant', 'support_at_home_participant', 'aged_care_provider_prospect', 'private_pay_household', 'platform_listing')),
  display_alias text not null,
  source text not null,
  suburb text not null,
  funding_lane text not null check (funding_lane in ('support_at_home', 'ndis', 'private_pay', 'premium_private')),
  requested_services text[] not null default '{}',
  proposed_days text[] not null default '{}',
  hours_per_visit numeric,
  weekly_frequency numeric,
  advertised_provider_rate_cents bigint,
  proposed_worker_rate_cents bigint,
  agreed_worker_rate_cents bigint,
  travel_estimate_minutes integer,
  -- fit_factors: { serviceScopeFit, scheduleFit, netEarningPotential, travel, readinessToCommence } — commercial/logistics only, never protected traits
  fit_factors jsonb,
  status text not null default 'inbox' check (status in ('inbox', 'contacted', 'qualified', 'call_meeting', 'proposal_pending', 'won_onboarding', 'active', 'lost', 'not_suitable', 'archived')),
  status_reason text,
  readiness_badge text not null default 'unverified' check (readiness_badge in ('unverified', 'need_provider_approval', 'ready_to_quote', 'awaiting_response')),
  assigned_org_id uuid references organisations(id) on delete set null,
  next_action_at timestamptz,
  next_action_label text,
  last_contact_at timestamptz,
  converted_client_id uuid references clients(id) on delete set null,
  -- activity_log: [{ at: iso string, note: string }, ...]
  activity_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients
  add constraint clients_contracted_payer_id_fkey
  foreign key (contracted_payer_id) references contacts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Engagements: one active funding/scope/rate agreement per client.
-- ---------------------------------------------------------------------------
create table if not exists engagements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  funding_lane text not null check (funding_lane in ('support_at_home', 'ndis', 'private_pay', 'premium_private')),
  scope_allowed text[] not null default '{}',
  scope_excluded text[] not null default '{}',
  start_date date not null default current_date,
  end_date date,
  provider_approval_status text not null default 'not_required' check (provider_approval_status in ('not_required', 'pending', 'granted', 'declined')),
  transport_consent_status text not null default 'not_required' check (transport_consent_status in ('not_required', 'pending', 'granted')),
  readiness_state text not null default 'amber' check (readiness_state in ('red', 'amber', 'green')),
  readiness_blockers text[] not null default '{}',
  cancellation_terms text not null default '',
  travel_terms text not null default '',
  billing_terms text not null default '',
  agreed_worker_rate_cents bigint not null default 0 check (agreed_worker_rate_cents >= 0),
  rate_unit text not null default 'hour' check (rate_unit in ('hour', 'visit')),
  status text not null default 'draft' check (status in ('draft', 'active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Availability blocks: the operator's own recurring/one-off blocked time.
-- ---------------------------------------------------------------------------
create table if not exists availability_blocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  block_type text not null check (block_type in ('available', 'parenting', 'other_employment', 'personal', 'unavailable', 'travel_buffer')),
  display_label text not null,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

-- ---------------------------------------------------------------------------
-- Sessions: planned/delivered visits.
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  engagement_id uuid not null references engagements(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  planned_start timestamptz not null,
  planned_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,
  status text not null default 'proposed' check (status in ('proposed', 'tentative', 'confirmed', 'in_progress', 'completed', 'reviewed', 'invoiced', 'paid', 'cancelled', 'no_show', 'disputed')),
  suburb text not null,
  service_type text not null,
  travel_buffer_before_min integer not null default 0 check (travel_buffer_before_min >= 0),
  travel_buffer_after_min integer not null default 0 check (travel_buffer_after_min >= 0),
  note_id uuid, -- FK to service_notes added below, once that table exists
  invoice_line_id text,
  -- cancellation: { recordedAt, reason, chargeable, chargeableReason } once cancelled
  cancellation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (planned_end > planned_start)
);

-- ---------------------------------------------------------------------------
-- Service notes: one per delivered session. Append-only in spirit — the
-- app only ever inserts, and marks `locked_at` on creation (see RLS below,
-- which has no update/delete policy for this table).
-- ---------------------------------------------------------------------------
create table if not exists service_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  activities text not null,
  participant_response text not null default '',
  factual_observations text not null default '',
  next_steps text not null default '',
  created_at timestamptz not null default now(),
  locked_at timestamptz not null default now(),
  unique (session_id)
);

alter table sessions
  add constraint sessions_note_id_fkey
  foreign key (note_id) references service_notes(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Row Level Security — owner-scoped throughout, no exceptions.
-- ---------------------------------------------------------------------------
alter table operator_profiles enable row level security;
alter table organisations enable row level security;
alter table contacts enable row level security;
alter table clients enable row level security;
alter table leads enable row level security;
alter table engagements enable row level security;
alter table availability_blocks enable row level security;
alter table sessions enable row level security;
alter table service_notes enable row level security;

create policy "owner reads own profile" on operator_profiles
  for select using (id = auth.uid());
create policy "owner inserts own profile" on operator_profiles
  for insert with check (id = auth.uid());
create policy "owner updates own profile" on operator_profiles
  for update using (id = auth.uid());

create policy "owner manages organisations" on organisations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner manages contacts" on contacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner manages clients" on clients
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner manages leads" on leads
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner manages engagements" on engagements
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner manages availability_blocks" on availability_blocks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner manages sessions" on sessions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- service_notes: insert and read only — no update/delete policy, so a
-- written note cannot be edited or removed through the API (correction
-- happens via a new note referencing a correction reason, not a mutation of
-- the original record). This is a deliberate Gate 2 "poor man's audit
-- trail"; Gate 4 replaces it with a proper append-only history table.
create policy "owner reads own service_notes" on service_notes
  for select using (owner_id = auth.uid());
create policy "owner inserts own service_notes" on service_notes
  for insert with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Atomic helpers (plain SQL functions — NOT security definer, so RLS still
-- applies to the UPDATE inside: a caller can only ever touch their own rows).
-- ---------------------------------------------------------------------------
create or replace function append_lead_activity(p_lead_id uuid, p_note text)
returns void
language sql
as $$
  update leads
  set activity_log = activity_log || jsonb_build_array(jsonb_build_object('at', now(), 'note', p_note)),
      last_contact_at = now()
  where id = p_lead_id;
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger operator_profiles_set_updated_at before update on operator_profiles
  for each row execute function set_updated_at();
create trigger organisations_set_updated_at before update on organisations
  for each row execute function set_updated_at();
create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();
create trigger engagements_set_updated_at before update on engagements
  for each row execute function set_updated_at();
create trigger sessions_set_updated_at before update on sessions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create an operator_profiles row the first time someone signs up.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.operator_profiles (id, trading_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'trading_name', ''), 'KOVA Support'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
