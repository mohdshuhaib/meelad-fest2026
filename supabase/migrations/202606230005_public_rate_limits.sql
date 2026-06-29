create table public.public_request_events(id bigint generated always as identity primary key,event_type text not null check(event_type in('registration','access_reset')),identifier_hash text not null,created_at timestamptz not null default now());
create index public_request_events_lookup on public.public_request_events(event_type,identifier_hash,created_at desc);
alter table public.public_request_events enable row level security;
revoke all on public.public_request_events from anon,authenticated;
