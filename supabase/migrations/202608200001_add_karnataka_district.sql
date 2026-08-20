alter table public.participants drop constraint participants_district_check;
alter table public.participants add constraint participants_district_check check(district=any(array['THIRUVANANTHAPURAM','KOLLAM','PATHANAMTHITTA','ALAPPUZHA','KOTTAYAM','IDUKKI','ERNAKULAM','THRISSUR','PALAKKAD','MALAPPURAM','KOZHIKODE','WAYANAD','KANNUR','KASARAGOD','LAKSHADWEEP','KARNATAKA']));
