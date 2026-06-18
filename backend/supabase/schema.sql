create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.guard_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;

  if auth.uid() is null then
    return new;
  end if;

  if new.user_id is distinct from auth.uid() then
    raise exception 'Voce nao tem permissao para acessar este registro';
  end if;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_profissional text not null,
  nome_salao text,
  whatsapp text not null,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  whatsapp text not null,
  data_nascimento date,
  observacoes text,
  preferencias text,
  alergias text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clientes_user_whatsapp_unique unique (user_id, whatsapp)
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  valor_padrao numeric(12,2) not null check (valor_padrao > 0),
  tempo_estimado_minutos integer check (tempo_estimado_minutos is null or tempo_estimado_minutos > 0),
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint servicos_user_nome_unique unique (user_id, nome)
);

create table if not exists public.categorias_despesas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categorias_user_nome_unique unique (user_id, nome)
);

create table if not exists public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  cliente_id uuid not null references public.clientes(id),
  servico_id uuid not null references public.servicos(id),
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  duracao_minutos integer not null,
  valor_cobrado numeric(12,2) not null check (valor_cobrado >= 0),
  forma_pagamento text not null,
  observacoes text,
  status text not null default 'realizado' check (status in ('realizado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint atendimentos_horario_check check (hora_fim > hora_inicio)
);

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  categoria_id uuid not null references public.categorias_despesas(id),
  descricao text not null,
  valor numeric(12,2) not null check (valor > 0),
  data date not null,
  observacao text,
  status text not null default 'ativa' check (status in ('ativa', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.validate_atendimento()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from public.clientes c where c.id = new.cliente_id and c.user_id = new.user_id) then
    raise exception 'Cliente invalida';
  end if;

  if not exists (select 1 from public.servicos s where s.id = new.servico_id and s.user_id = new.user_id) then
    raise exception 'Servico invalido';
  end if;

  if new.hora_fim <= new.hora_inicio then
    raise exception 'Hora fim deve ser maior que hora inicio';
  end if;

  new.duracao_minutos = extract(epoch from (new.hora_fim - new.hora_inicio)) / 60;
  return new;
end;
$$;

create or replace function public.validate_despesa()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from public.categorias_despesas c where c.id = new.categoria_id and c.user_id = new.user_id) then
    raise exception 'Categoria invalida';
  end if;
  return new;
end;
$$;

create or replace function public.seed_default_records(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.servicos (user_id, nome, valor_padrao, tempo_estimado_minutos)
  values
    (p_user_id, 'Manicure simples', 35, 60),
    (p_user_id, 'Pedicure', 40, 60),
    (p_user_id, 'Esmaltacao em gel', 70, 90),
    (p_user_id, 'Alongamento em gel', 150, 150),
    (p_user_id, 'Fibra de vidro', 170, 180),
    (p_user_id, 'Banho de gel', 90, 120),
    (p_user_id, 'Spa dos pes', 80, 90)
  on conflict (user_id, nome) do nothing;

  insert into public.categorias_despesas (user_id, nome)
  values
    (p_user_id, 'Produtos'),
    (p_user_id, 'Materiais descartaveis'),
    (p_user_id, 'Aluguel'),
    (p_user_id, 'Energia'),
    (p_user_id, 'Internet'),
    (p_user_id, 'Marketing'),
    (p_user_id, 'Manutencao'),
    (p_user_id, 'Outros')
  on conflict (user_id, nome) do nothing;
end;
$$;

create or replace function public.create_default_records()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  perform public.seed_default_records(auth.uid());
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome_profissional, nome_salao, whatsapp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_profissional', 'Profissional'),
    nullif(new.raw_user_meta_data->>'nome_salao', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', '')
  )
  on conflict (id) do nothing;

  perform public.seed_default_records(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists clientes_guard_user_id on public.clientes;
create trigger clientes_guard_user_id before insert or update on public.clientes for each row execute function public.guard_user_id();
drop trigger if exists clientes_updated_at on public.clientes;
create trigger clientes_updated_at before update on public.clientes for each row execute function public.set_updated_at();

drop trigger if exists servicos_guard_user_id on public.servicos;
create trigger servicos_guard_user_id before insert or update on public.servicos for each row execute function public.guard_user_id();
drop trigger if exists servicos_updated_at on public.servicos;
create trigger servicos_updated_at before update on public.servicos for each row execute function public.set_updated_at();

drop trigger if exists categorias_guard_user_id on public.categorias_despesas;
create trigger categorias_guard_user_id before insert or update on public.categorias_despesas for each row execute function public.guard_user_id();
drop trigger if exists categorias_updated_at on public.categorias_despesas;
create trigger categorias_updated_at before update on public.categorias_despesas for each row execute function public.set_updated_at();

drop trigger if exists atendimentos_guard_user_id on public.atendimentos;
create trigger atendimentos_guard_user_id before insert or update on public.atendimentos for each row execute function public.guard_user_id();
drop trigger if exists atendimentos_validate on public.atendimentos;
create trigger atendimentos_validate before insert or update on public.atendimentos for each row execute function public.validate_atendimento();
drop trigger if exists atendimentos_updated_at on public.atendimentos;
create trigger atendimentos_updated_at before update on public.atendimentos for each row execute function public.set_updated_at();

drop trigger if exists despesas_guard_user_id on public.despesas;
create trigger despesas_guard_user_id before insert or update on public.despesas for each row execute function public.guard_user_id();
drop trigger if exists despesas_validate on public.despesas;
create trigger despesas_validate before insert or update on public.despesas for each row execute function public.validate_despesa();
drop trigger if exists despesas_updated_at on public.despesas;
create trigger despesas_updated_at before update on public.despesas for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.servicos enable row level security;
alter table public.categorias_despesas enable row level security;
alter table public.atendimentos enable row level security;
alter table public.despesas enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "clientes_select_own" on public.clientes for select using (user_id = auth.uid());
create policy "clientes_insert_own" on public.clientes for insert with check (user_id = auth.uid());
create policy "clientes_update_own" on public.clientes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "clientes_no_physical_delete" on public.clientes for delete using (false);

create policy "servicos_select_own" on public.servicos for select using (user_id = auth.uid());
create policy "servicos_insert_own" on public.servicos for insert with check (user_id = auth.uid());
create policy "servicos_update_own" on public.servicos for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "servicos_no_physical_delete" on public.servicos for delete using (false);

create policy "categorias_select_own" on public.categorias_despesas for select using (user_id = auth.uid());
create policy "categorias_insert_own" on public.categorias_despesas for insert with check (user_id = auth.uid());
create policy "categorias_update_own" on public.categorias_despesas for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categorias_no_physical_delete" on public.categorias_despesas for delete using (false);

create policy "atendimentos_select_own" on public.atendimentos for select using (user_id = auth.uid());
create policy "atendimentos_insert_own" on public.atendimentos for insert with check (user_id = auth.uid());
create policy "atendimentos_update_own" on public.atendimentos for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "atendimentos_no_physical_delete" on public.atendimentos for delete using (false);

create policy "despesas_select_own" on public.despesas for select using (user_id = auth.uid());
create policy "despesas_insert_own" on public.despesas for insert with check (user_id = auth.uid());
create policy "despesas_update_own" on public.despesas for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "despesas_no_physical_delete" on public.despesas for delete using (false);

create index if not exists clientes_user_id_idx on public.clientes(user_id);
create index if not exists clientes_user_ativo_idx on public.clientes(user_id, ativo);
create index if not exists servicos_user_id_idx on public.servicos(user_id);
create index if not exists servicos_user_ativo_idx on public.servicos(user_id, ativo);
create index if not exists atendimentos_user_data_idx on public.atendimentos(user_id, data);
create index if not exists atendimentos_user_cliente_idx on public.atendimentos(user_id, cliente_id);
create index if not exists atendimentos_user_servico_idx on public.atendimentos(user_id, servico_id);
create index if not exists atendimentos_user_status_idx on public.atendimentos(user_id, status);
create index if not exists despesas_user_data_idx on public.despesas(user_id, data);
create index if not exists despesas_user_categoria_idx on public.despesas(user_id, categoria_id);
create index if not exists despesas_user_status_idx on public.despesas(user_id, status);
create index if not exists categorias_user_id_idx on public.categorias_despesas(user_id);
create index if not exists categorias_user_ativo_idx on public.categorias_despesas(user_id, ativo);
