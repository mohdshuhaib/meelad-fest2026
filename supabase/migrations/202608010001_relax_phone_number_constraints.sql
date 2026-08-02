DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.profiles'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%[6-9][0-9]{9}%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;

  FOR r IN (
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.participants'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%[6-9][0-9]{9}%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.participants DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_whatsapp_number_check CHECK (whatsapp_number ~ '^\+?[0-9]{6,15}$');
ALTER TABLE public.participants ADD CONSTRAINT participants_whatsapp_number_check CHECK (whatsapp_number ~ '^\+?[0-9]{6,15}$');
ALTER TABLE public.participants ADD CONSTRAINT participants_phone_number_check CHECK (phone_number ~ '^\+?[0-9]{6,15}$');
