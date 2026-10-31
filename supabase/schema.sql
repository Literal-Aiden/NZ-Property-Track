-- NZ Property Tracker: sync across devices.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste all of this → Run.
-- Safe to run again (it skips or replaces what already exists).

-- ── Properties ─────────────────────────────────────────────────────────────
-- One row per property per user. The property's whole JSON is in `data`, the same shape the app keeps in
-- localStorage, so the app's code reads it unchanged. `updated` is set by the database (not the phone's clock), so
-- each device can ask for "everything changed since I last looked". A deleted property is kept as a row with
-- `deleted` true and empty data, so the delete reaches the other devices too.
create table if not exists public.props (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists props_user_updated on public.props (user_id, updated);

create or replace function public.props_touch() returns trigger language plpgsql as $$
begin new.updated := now(); return new; end $$;
drop trigger if exists props_touch on public.props;
create trigger props_touch before insert or update on public.props for each row execute function public.props_touch();

-- Row level security: each signed-in user can only see and change their own rows. This is enforced by the
-- database, so it holds even if someone uses the public key outside the app.
alter table public.props enable row level security;
-- Signed-in users can reach the table through the app's API (the rules below still limit them to their own rows);
-- signed-out visitors can't reach it at all. Needed when new tables aren't exposed automatically.
revoke all on public.props from anon;
grant select, insert, update, delete on public.props to authenticated;
drop policy if exists "own rows: read" on public.props;
drop policy if exists "own rows: add" on public.props;
drop policy if exists "own rows: change" on public.props;
drop policy if exists "own rows: remove" on public.props;
create policy "own rows: read" on public.props for select to authenticated using (user_id = auth.uid());
create policy "own rows: add" on public.props for insert to authenticated with check (user_id = auth.uid());
create policy "own rows: change" on public.props for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows: remove" on public.props for delete to authenticated using (user_id = auth.uid());

-- ── Files (receipts, progress photos, cover photos, Healthy Homes reports) ─
-- A private bucket. Each file is stored at <user id>/<file id>, and a user can only reach their own folder.
-- Photos are already scaled to 1600px by the app; 10 MB allows for large PDFs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('files', 'files', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "own files: read" on storage.objects;
drop policy if exists "own files: add" on storage.objects;
drop policy if exists "own files: change" on storage.objects;
drop policy if exists "own files: remove" on storage.objects;
create policy "own files: read" on storage.objects for select to authenticated
  using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files: add" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files: change" on storage.objects for update to authenticated
  using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files: remove" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Delete my account ──────────────────────────────────────────────────────
-- For the "Delete my account and data" button (NZ Privacy Act: people can ask for their data to be removed).
-- Removing the user also removes their property rows (on delete cascade). The app deletes their files from storage
-- first, since Supabase doesn't let the database remove storage files directly.
create or replace function public.delete_me() returns void language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_me() from public, anon;
grant execute on function public.delete_me() to authenticated;
