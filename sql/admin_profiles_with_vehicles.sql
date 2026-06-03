-- Function to return profiles with their vehicles for admin use
-- SECURITY DEFINER so it can bypass per-row RLS checks when executed by authenticated users

CREATE OR REPLACE FUNCTION public.admin_profiles_with_vehicles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  vehicles jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id, p.email, p.created_at,
    COALESCE(jsonb_agg(jsonb_build_object('license_plate', v.license_plate, 'created_at', v.created_at) ORDER BY v.created_at DESC) FILTER (WHERE v.id IS NOT NULL), '[]'::jsonb) as vehicles
  FROM public.profiles p
  LEFT JOIN public.vehicles v ON v.user_id = p.id
  GROUP BY p.id
  ORDER BY p.created_at DESC;
$$;

-- Allow authenticated users to execute this function (adjust as needed for your security model)
GRANT EXECUTE ON FUNCTION public.admin_profiles_with_vehicles() TO authenticated;

-- Note: creating a SECURITY DEFINER function exposes data; ensure only intended callers (admin UI) use this RPC.
