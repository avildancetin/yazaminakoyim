-- Add 'sen_kimsin_amk' column to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sen_kimsin_amk') THEN
        ALTER TABLE public.profiles ADD COLUMN sen_kimsin_amk TEXT;
    END IF;
END
$$;

-- Add 'currently_reading' column to profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'currently_reading') THEN
        ALTER TABLE public.profiles ADD COLUMN currently_reading TEXT;
    END IF;
END
$$;



