-- Add swalath campaign configuration to programs table
alter table public.programs
  add column if not exists is_swalath_campaign boolean not null default false,
  add column if not exists campaign_start_date date default '2026-08-22',
  add column if not exists campaign_end_date date default '2026-09-05';

-- Add daily entries and total swalath count to participant_programs table
alter table public.participant_programs
  add column if not exists swalath_entries jsonb not null default '{}'::jsonb,
  add column if not exists swalath_total integer not null default 0;

-- Create index for sorting and ranking by swalath_total
create index if not exists idx_participant_programs_swalath_total 
  on public.participant_programs(program_id, swalath_total desc);

-- Automatically mark FSS001 or any program with 'SWALATH' in name/code as a swalath campaign
update public.programs
  set is_swalath_campaign = true,
      campaign_start_date = coalesce(campaign_start_date, '2026-08-22'),
      campaign_end_date = coalesce(campaign_end_date, '2026-09-05')
  where code = 'FSS001' or name ilike '%SWALATH%';

-- Ensure FSS001 exists with standard defaults if not already present
insert into public.programs (
  code,
  name,
  description,
  gender_eligibility,
  category_eligibility,
  global_status,
  is_swalath_campaign,
  campaign_start_date,
  campaign_end_date
) values (
  'FSS001',
  'SWALATH CAMPAIGN',
  'Swalath Campaign for Super Senior and Female. Log daily swalath recitations from 22/08/2026 to 05/09/2026.',
  'female',
  'super_senior',
  'ongoing',
  true,
  '2026-08-22',
  '2026-09-05'
)
on conflict (code) do update set
  is_swalath_campaign = true,
  campaign_start_date = excluded.campaign_start_date,
  campaign_end_date = excluded.campaign_end_date;
