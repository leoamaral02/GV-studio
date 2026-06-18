# GV Studio Backend

Backend baseado em Supabase PostgreSQL.

O arquivo principal e `supabase/schema.sql`.

Ele cria:

- tabelas `profiles`, `clientes`, `servicos`, `atendimentos`, `categorias_despesas` e `despesas`;
- constraints de validacao;
- triggers para `updated_at`, `user_id`, duracao de atendimento e seeds;
- Row Level Security;
- policies para isolamento por usuaria;
- bloqueio de exclusao fisica nos registros principais.

## Como aplicar

Abra o SQL Editor do Supabase e execute:

```sql
-- conteudo de supabase/schema.sql
```
