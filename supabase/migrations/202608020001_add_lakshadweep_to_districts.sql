DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Drop the existing check constraint on the district column
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.participants'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%THIRUVANANTHAPURAM%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.participants DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Add the new constraint with LAKSHADWEEP included
ALTER TABLE public.participants 
ADD CONSTRAINT participants_district_check 
CHECK (district = ANY (ARRAY[
  'THIRUVANANTHAPURAM',
  'KOLLAM',
  'PATHANAMTHITTA',
  'ALAPPUZHA',
  'KOTTAYAM',
  'IDUKKI',
  'ERNAKULAM',
  'THRISSUR',
  'PALAKKAD',
  'MALAPPURAM',
  'KOZHIKODE',
  'WAYANAD',
  'KANNUR',
  'KASARAGOD',
  'LAKSHADWEEP'
]));
