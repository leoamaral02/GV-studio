create index if not exists clientes_user_ativo_idx on public.clientes(user_id, ativo);
create index if not exists servicos_user_ativo_idx on public.servicos(user_id, ativo);
create index if not exists atendimentos_user_cliente_idx on public.atendimentos(user_id, cliente_id);
create index if not exists atendimentos_user_servico_idx on public.atendimentos(user_id, servico_id);
create index if not exists atendimentos_user_status_idx on public.atendimentos(user_id, status);
create index if not exists despesas_user_categoria_idx on public.despesas(user_id, categoria_id);
create index if not exists despesas_user_status_idx on public.despesas(user_id, status);
create index if not exists categorias_user_ativo_idx on public.categorias_despesas(user_id, ativo);
