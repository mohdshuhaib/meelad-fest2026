create view public.individual_scores_view as
select 
  p.id as participant_id,
  p.name,
  p.district,
  p.category,
  p.gender,
  sum(pp.result_points) as total_points,
  count(pp.program_id) as program_count
from public.participants p
join public.participant_programs pp on p.id = pp.participant_id
join public.programs pr on pp.program_id = pr.id
where pp.result_points is not null 
  and pp.result_points > 0 
  and pr.results_published = true
group by p.id, p.name, p.district, p.category, p.gender;
