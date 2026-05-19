-- Run this in Supabase SQL Editor after prisma migrate deploy
-- Creates profile on auth.users insert and basic RLS

-- Trigger: auto-create Profile on signup (role always 'user' for public signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public."Profile" (id, username, email, role, "isActive", "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    'user',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS on Profile
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public."Profile";
CREATE POLICY "Users can read own profile"
  ON public."Profile"
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public."Profile";
CREATE POLICY "Users can update own profile"
  ON public."Profile"
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent public RPC execution of trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Service role / server bypasses RLS; app APIs use Prisma with service role or session + API checks
