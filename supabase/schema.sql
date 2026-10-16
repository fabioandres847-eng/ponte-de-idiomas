-- Base de datos del muro de la comunidad (Supabase, plan gratuito).
-- Ejecútalo una vez en Supabase > SQL Editor. Activa también Authentication > Email (enlace mágico).

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lang text not null check (lang ~ '^[a-z]{2,3}$'),
  kind text not null check (kind in ('gramatica','vocabulario','pronunciacion','audiovisual','consejo')),
  title text not null check (char_length(title) between 3 and 90),
  body text not null check (char_length(body) between 3 and 1500),
  link text check (link is null or link ~ '^https?://'),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.posts enable row level security;
alter table public.votes enable row level security;

-- Todo el mundo puede leer; solo personas con sesión pueden escribir, y solo lo suyo.
create policy "posts: lectura pública" on public.posts for select using (true);
create policy "posts: crear propios" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "posts: borrar propios" on public.posts for delete to authenticated using (user_id = auth.uid());

create policy "votes: lectura pública" on public.votes for select using (true);
create policy "votes: votar" on public.votes for insert to authenticated with check (user_id = auth.uid());
create policy "votes: quitar voto" on public.votes for delete to authenticated using (user_id = auth.uid());

create index if not exists posts_lang_created on public.posts (lang, created_at desc);
