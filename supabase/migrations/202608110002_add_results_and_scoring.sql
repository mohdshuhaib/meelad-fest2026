create type public.result_grade as enum ('A', 'B', 'C', 'None');
create type public.result_position as enum ('1st', '2nd', '3rd', 'None');

alter table public.app_settings
add column point_rules jsonb not null default '{
  "normal": {
    "grades": { "A": 5, "B": 3, "C": 1 },
    "positions": { "1st": 5, "2nd": 3, "3rd": 1 }
  },
  "general": {
    "grades": { "A": 10, "B": 8, "C": 6 },
    "positions": { "1st": 5, "2nd": 3, "3rd": 1 }
  }
}';

alter table public.participant_programs
add column result_grade public.result_grade,
add column result_position public.result_position,
add column result_points integer;

alter table public.programs
add column results_published boolean not null default false;
