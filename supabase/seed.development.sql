-- DEVELOPMENT ONLY. Do not apply sample data to production.
insert into public.groups(name,whatsapp_group_link) values('GROUP 1',null),('GROUP 2',null),('GROUP 3',null) on conflict(name) do nothing;
insert into public.programs(code,name,description,gender_eligibility,category_eligibility,global_status) values
('ESS01','ENGLISH ESSAY','Development sample programme','general','general','not_started'),
('NAS01','NASHEED','Development sample programme','male','junior','not_started'),
('QIR01','QIRAATH','Development sample programme','general','general','not_started')
on conflict(code) do nothing;
