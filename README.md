# GV Studio

Sistema web SaaS individual para controle interno de manicure/nail designer.

O GV Studio permite controlar clientes, servicos, atendimentos, despesas, faturamento, lucro estimado, historico das clientes, relatorios e acesso rapido ao WhatsApp. A primeira versao foi pensada para uso individual: cada usuaria cria uma conta e acessa apenas os proprios dados.

## Status do projeto

Primeira versao funcional em desenvolvimento.

Implementado:

- autenticacao com Supabase Auth;
- layout privado responsivo;
- dashboard com dados reais;
- cadastro e gestao de clientes;
- perfil da cliente com historico;
- cadastro e gestao de servicos;
- registro e cancelamento de atendimentos;
- registro e cancelamento de despesas;
- categorias de despesas;
- relatorios com exportacao CSV;
- PWA basico;
- schema SQL com tabelas, constraints, triggers, seeds e RLS.

Ainda nao implementado nesta versao:

- agenda completa;
- lembretes automaticos;
- estoque detalhado;
- comissao;
- multiusuario por salao;
- assinatura paga;
- integracao oficial com WhatsApp API;
- app Android/iOS nativo;
- offline complexo.

## Versoes recomendadas

- Node.js: 20 LTS ou superior;
- npm: 10 ou superior;
- Supabase: projeto hospedado no Supabase Cloud ou Supabase local compativel;
- Navegador moderno: Chrome, Edge, Firefox ou Safari recentes.

O schema cria automaticamente:

- tabela `profiles`;
- tabela `clientes`;
- tabela `servicos`;
- tabela `atendimentos`;
- tabela `categorias_despesas`;
- tabela `despesas`;
- servicos padrao ao criar conta;
- categorias padrao ao criar conta;
- triggers de `updated_at`;
- calculo/validacao de duracao do atendimento;
- isolamento por `user_id`;
- bloqueio de exclusao fisica nos registros principais.

## RLS e autenticacao

Todas as tabelas principais usam Row Level Security.

Cada registro pertence a uma usuaria por meio de `user_id`, exceto `profiles`, cujo `id` e o mesmo `id` do usuario em `auth.users`.

As policies permitem que a usuaria autenticada leia e altere apenas os proprios registros. O frontend tambem valida formularios com Zod, mas a seguranca real fica no banco por meio de RLS, constraints e triggers.

Registros importantes nao sao apagados fisicamente:

- clientes usam `ativo = false`;
- servicos usam `ativo = false`;
- atendimentos usam `status = cancelado`;
- despesas usam `status = cancelada`;
- categorias usam `ativo = false`.

## Fluxo inicial para testar

1. Execute o SQL do backend no Supabase.
2. Configure `frontend/.env.local`.
3. Rode `npm install` dentro de `frontend`.
4. Rode `npm run dev`.
5. Abra `http://localhost:3000`.
6. Crie uma conta.
7. Confirme que servicos e categorias padrao foram criados.
8. Cadastre uma cliente, um atendimento e uma despesa.
9. Veja os dados no dashboard e nos relatorios.

## Observacoes

- O app usa tema escuro como padrao.
- A PWA e basica: manifest, icone e service worker simples.
- O WhatsApp abre via `https://wa.me/55NUMERO`.
- O projeto depende do Supabase para autenticacao e persistencia.
- Se `node` ou `npm` nao estiverem disponiveis no terminal, instale Node.js 20 LTS e abra um novo terminal.
