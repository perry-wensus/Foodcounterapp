-- RLS-test: draai met  psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql  (in een transactie, wordt teruggedraaid)
begin;

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.nl', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.nl', 'authenticated', 'authenticated');

-- Trigger heeft profielen aangemaakt
do $$ begin
  assert (select count(*) from public.profiles) = 2, 'profielen niet automatisch aangemaakt';
end $$;

-- Gebruiker A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
insert into public.scans (photo_paths) values (array['11111111-1111-1111-1111-111111111111/x/0.jpg']);
insert into public.shopping_items (name) values ('spinazie');
update public.profiles set consent_at = now(), consent_version = 'test';
do $$ begin
  assert (select count(*) from public.scans) = 1, 'A ziet eigen scan niet';
  assert (select count(*) from public.profiles) = 1, 'A ziet meer dan eigen profiel';
end $$;

-- Gebruiker B
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.scans) = 0, 'B ziet scan van A';
  assert (select count(*) from public.shopping_items) = 0, 'B ziet boodschappen van A';
  assert (select consent_at from public.profiles) is null, 'B ziet consent van A / eigen profiel fout';
end $$;
-- B kan A's rijen niet wijzigen of verwijderen
update public.scans set status = 'failed';
delete from public.shopping_items;
-- B kan geen rij namens A invoegen
do $$ begin
  begin
    insert into public.scans (user_id) values ('11111111-1111-1111-1111-111111111111');
    assert false, 'B kon rij voor A invoegen';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Storage: B mag niet in A's map uploaden
do $$ begin
  begin
    insert into storage.objects (bucket_id, name, owner_id)
      values ('scan-photos', '11111111-1111-1111-1111-111111111111/x/9.jpg', '22222222-2222-2222-2222-222222222222');
    assert false, 'B kon in map van A uploaden';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Terug naar A: data onaangetast
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
do $$ begin
  assert (select status from public.scans) = 'uploading', 'B heeft scan van A gewijzigd';
  assert (select count(*) from public.shopping_items) = 1, 'B heeft boodschappen van A verwijderd';
end $$;

-- Account verwijderen cascadeert naar alle tabellen
reset role;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
do $$ begin
  assert (select count(*) from public.scans) = 0, 'scans niet mee verwijderd';
  assert (select count(*) from public.shopping_items) = 0, 'boodschappen niet mee verwijderd';
  assert (select count(*) from public.profiles) = 1, 'profiel niet mee verwijderd';
end $$;

select 'RLS-test geslaagd' as resultaat;
rollback;
