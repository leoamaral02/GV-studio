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

Este reposititorio nao usa C#, Express, Auth.js, Prisma, Redux ou Zustand.

## Estrutura do projeto

```text
.
├── backend
│   ├── README.md
│   └── supabase
│       └── schema.sql
├── frontend
│   ├── app
│   ├── components
│   ├── lib
│   ├── public
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .gitignore
└── README.md
```

### `frontend`

Aplicacao Next.js com App Router, TypeScript, Tailwind CSS, componentes UI, Supabase Client/Auth, React Hook Form, Zod, Recharts, Sonner e PWA.

### `backend`

Schema SQL do Supabase PostgreSQL. Contem tabelas, validacoes, triggers, policies de Row Level Security e seeds dos registros padrao.

## Variaveis de ambiente

Crie o arquivo `frontend/.env.local` a partir de `frontend/.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Onde encontrar no Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings > API > Project URL;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings > API > Project API keys > anon public.

Nao coloque service role key no frontend.

## Configuracao do Supabase

Ordem recomendada:

1. Crie um projeto no Supabase.
2. Ative o provedor de autenticacao por e-mail/senha em Authentication.
3. Abra o SQL Editor.
4. Execute o conteudo de `backend/supabase/schema.sql`.
5. Copie a URL e a anon key do projeto.
6. Preencha `frontend/.env.local`.
7. Rode o frontend.

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

## Comandos do frontend

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependencias:

```bash
npm install
```

Rode em desenvolvimento:

```bash
npm run dev
```

Gerar build de producao:

```bash
npm run build
```

Rodar build de producao localmente:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

O app local abre em:

```text
http://localhost:3000
```

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
