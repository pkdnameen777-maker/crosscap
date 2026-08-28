-- CrossCap Admin dashboard (run once in Supabase SQL Editor)
-- Only listed admin emails can call these RPCs.

create or replace function public.is_crosscap_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and lower(u.email) in (
        'muhammedameenpkdn@gmail.com',
        'support@crosscap.app'
      )
  );
$$;

create or replace function public.admin_platform_stats()
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result json;
begin
  if not public.is_crosscap_admin() then
    raise exception 'Not authorized';
  end if;

  select json_build_object(
    'total_users', (select count(*)::int from auth.users),
    'total_holdings', (select count(*)::int from public.holdings),
    'total_properties', (select count(*)::int from public.properties),
    'total_cash_entries', (select count(*)::int from public.cash_accounts),
    'total_installments', (select count(*)::int from public.installments),
    'total_goals', (select count(*)::int from public.goals),
    'total_assets_tracked', (
      (select count(*)::int from public.holdings)
      + (select count(*)::int from public.properties)
      + (select count(*)::int from public.cash_accounts)
    ),
    'total_property_value_aed', (select coalesce(sum(total_price), 0) from public.properties),
    'generated_at', now()
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_user_asset_counts(search_email text default null)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result json;
begin
  if not public.is_crosscap_admin() then
    raise exception 'Not authorized';
  end if;

  select coalesce(json_agg(row_to_json(t) order by t.total_items desc), '[]'::json)
  into result
  from (
    select
      u.id::text as user_id,
      u.email,
      u.created_at,
      u.last_sign_in_at,
      coalesce(h.cnt, 0)::int as holdings_count,
      coalesce(p.cnt, 0)::int as properties_count,
      coalesce(c.cnt, 0)::int as cash_entries_count,
      coalesce(i.cnt, 0)::int as installments_count,
      coalesce(g.cnt, 0)::int as goals_count,
      (
        coalesce(h.cnt, 0) + coalesce(p.cnt, 0) + coalesce(c.cnt, 0)
      )::int as total_items,
      coalesce(p.val, 0)::numeric as property_value_aed
    from auth.users u
    left join (
      select user_id, count(*) as cnt from public.holdings group by user_id
    ) h on h.user_id = u.id
    left join (
      select user_id, count(*) as cnt, sum(total_price) as val from public.properties group by user_id
    ) p on p.user_id = u.id
    left join (
      select user_id, count(*) as cnt from public.cash_accounts group by user_id
    ) c on c.user_id = u.id
    left join (
      select user_id, count(*) as cnt from public.installments group by user_id
    ) i on i.user_id = u.id
    left join (
      select user_id, count(*) as cnt from public.goals group by user_id
    ) g on g.user_id = u.id
    where (
      search_email is null
      or search_email = ''
      or lower(u.email) like '%' || lower(search_email) || '%'
    )
  ) t;

  return result;
end;
$$;

create or replace function public.admin_user_detail(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  result json;
begin
  if not public.is_crosscap_admin() then
    raise exception 'Not authorized';
  end if;

  select json_build_object(
    'user', (
      select json_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at
      )
      from auth.users u where u.id = p_user_id
    ),
    'profile', (
      select row_to_json(pr) from public.profiles pr where pr.id = p_user_id
    ),
    'holdings', (
      select coalesce(json_agg(h order by h.symbol), '[]'::json)
      from public.holdings h where h.user_id = p_user_id
    ),
    'properties', (
      select coalesce(json_agg(p order by p.name), '[]'::json)
      from public.properties p where p.user_id = p_user_id
    ),
    'cash_accounts', (
      select coalesce(json_agg(c order by c.name), '[]'::json)
      from public.cash_accounts c where c.user_id = p_user_id
    ),
    'goals', (
      select coalesce(json_agg(g order by g.title), '[]'::json)
      from public.goals g where g.user_id = p_user_id
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.is_crosscap_admin() to authenticated;
grant execute on function public.admin_platform_stats() to authenticated;
grant execute on function public.admin_user_asset_counts(text) to authenticated;
grant execute on function public.admin_user_detail(uuid) to authenticated;
