-- Optional synthetic demo data for a fresh Supabase project — run this
-- AFTER schema.sql and AFTER you've signed up once (via /signup), so there
-- is an operator account to own these rows. Invented names/figures only,
-- same spirit as the Gate 1 fixtures (src/lib/fixtures.ts) — never real
-- client data. Safe to skip entirely; Leads works fine starting empty.
do $$
declare
  v_owner uuid;
begin
  select id into v_owner from auth.users order by id limit 1;
  if v_owner is null then
    raise exception 'No operator account found — sign up via /signup first, then re-run this seed.';
  end if;

  insert into organisations (owner_id, legal_name, trading_name, organisation_type, status, registration_verified_at)
  values
    (v_owner, 'Horizon Aged Care Services Ltd', 'Horizon Aged Care', 'aged_provider', 'active', now() - interval '120 days'),
    (v_owner, 'Gold Coast Home Care Co Pty Ltd', null, 'aged_provider', 'prospect', null);

  insert into leads (owner_id, type, display_alias, source, suburb, funding_lane, requested_services, proposed_days, hours_per_visit, weekly_frequency, proposed_worker_rate_cents, status, readiness_badge)
  values
    (v_owner, 'support_at_home_participant', 'E. Mahoney (Nerang)', 'Support coordinator referral', 'Nerang', 'support_at_home', array['Domestic assistance','Grocery shopping'], array['Mon','Wed','Fri'], 2, 3, 9500, 'active', 'need_provider_approval'),
    (v_owner, 'ndis_participant', 'R. Okafor (Woolloongabba)', 'Direct enquiry', 'Woolloongabba', 'ndis', array['Community access'], array['Sun'], 7, 1, 13350, 'active', 'unverified'),
    (v_owner, 'private_pay_household', 'M. Tran (Burleigh Heads)', 'Word of mouth', 'Burleigh Heads', 'private_pay', array['Weekly meal preparation'], array['Tue'], 2, 1, 8500, 'qualified', 'ready_to_quote'),
    (v_owner, 'platform_listing', 'New platform applicant — Varsity Lakes', 'Platform listing', 'Varsity Lakes', 'private_pay', array['Companionship','Light domestic'], array['Flexible'], null, null, null, 'contacted', 'unverified');
end $$;
