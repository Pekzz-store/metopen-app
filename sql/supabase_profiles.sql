-- Supabase SQL: profiles table, RLS, policies, triggers, and RPCs

-- ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create or ensure profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.b) Ensure updated_at exists on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 1.c) Create vehicles table if not exists (per-user vehicle records)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 1.d) Migrate any existing vehicle data from profiles into vehicles, then drop vehicle columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='license_plate') THEN
    INSERT INTO public.vehicles (user_id, license_plate, vehicle_type, created_at)
    SELECT id, license_plate, coalesce(vehicle_type, 'Mobil'), now()
    FROM public.profiles
    WHERE license_plate IS NOT NULL;

    ALTER TABLE public.profiles
      DROP COLUMN IF EXISTS license_plate,
      DROP COLUMN IF EXISTS vehicle_type;
  END IF;
END$$;

-- 2) Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Policies (drop + create)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
CREATE POLICY "Authenticated users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

-- 4) Migrate existing auth.users into profiles
INSERT INTO public.profiles (id, email, created_at)
SELECT id, email, created_at FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 5) Trigger function to auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.create_profile(
  p_email text
)
RETURNS TABLE(id uuid) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.profiles (email, created_at)
  VALUES (p_email, now())
  RETURNING id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_profile(
  p_id uuid,
  p_email text
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET email = p_email,
      updated_at = now()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) RPC: delete_profile
CREATE OR REPLACE FUNCTION public.delete_profile(p_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Grant execute to authenticated (adjust as needed)
GRANT EXECUTE ON FUNCTION public.create_profile(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_profile(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_profile(uuid) TO authenticated;

-- End of file
