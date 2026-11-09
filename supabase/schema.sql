-- =====================================================================
-- App de Revelação de Fotos — Etapa 1
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

-- Tabela de pedidos ---------------------------------------------------
create table if not exists public.pedidos (
  id              uuid primary key default gen_random_uuid(),
  numero          bigint generated always as identity (start with 1001) unique,
  nome            text not null,
  whatsapp        text not null,
  email           text not null,
  tamanho         text not null check (tamanho in ('10x15', '15x21')),
  quantidade      integer not null check (quantidade > 0),
  preco_unitario  numeric(10, 2) not null,
  total           numeric(10, 2) not null,
  status          text not null default 'enviando_fotos'
                  check (status in ('enviando_fotos', 'aguardando_pagamento')),
  pasta           text,                          -- ex.: pedido-1001/10x15
  fotos           jsonb not null default '[]',   -- caminhos dos arquivos no Storage
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index if not exists pedidos_status_idx on public.pedidos (status);
create index if not exists pedidos_criado_em_idx on public.pedidos (criado_em desc);

-- Atualiza "atualizado_em" automaticamente
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists pedidos_atualizado_em on public.pedidos;
create trigger pedidos_atualizado_em
  before update on public.pedidos
  for each row execute function public.tocar_atualizado_em();

-- Segurança: RLS ligado e NENHUMA política pública.
-- Só o servidor do app (chave service_role) lê e grava pedidos.
alter table public.pedidos enable row level security;

-- Bucket privado para as fotos -----------------------------------------
-- 50 MB por arquivo, só imagens.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 52428800, array['image/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
