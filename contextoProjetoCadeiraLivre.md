# Contexto do Projeto: Cadeira Livre

## 1. Visão Geral

O Cadeira Livre é uma plataforma SaaS multi-tenant para gestão de barbearias. O sistema oferece uma vitrine pública para agendamentos e um painel administrativo para gerenciar agenda, profissionais, serviços, clientes e indicadores. O isolamento entre barbearias e a prevenção de agendamentos simultâneos são tratados principalmente no backend e no PostgreSQL.

## 2. Stack Tecnológica

O repositório é organizado como monorepo, com as aplicações em `backend` e `frontend`.

**Backend**
- Node.js >= 24 e TypeScript nativo com ESM.
- Fastify 5.
- PostgreSQL 16 e `postgres.js` para SQL parametrizado.
- Zod para validação.
- DBMate para migrations.
- JWT (`@fastify/jwt`) e bcrypt (`bcryptjs`) para autenticação.

**Frontend**
- Next.js 16 com App Router e Turbopack.
- React 19 e TypeScript.
- Tailwind CSS v4, componentes Shadcn UI e ícones Lucide.
- React Hook Form e Zod para formulários.
- date-fns para datas e horários.
- Sonner para notificações toast.

## 3. Organização e Padrões

### Backend

O backend é organizado por módulos de domínio em `backend/src/modules/[módulo]/`:
- `dtos/`: schemas e validação de entrada.
- `database/`: consultas e operações SQL.
- `domain/`: regras de negócio sem dependência HTTP quando aplicável.
- `*.routes.ts`: rotas Fastify e integração entre validação, domínio e persistência.

As migrations DBMate ficam em `backend/db/migrations/`. As consultas devem sempre aplicar o escopo do tenant (`barbershop_id`) quando trabalham com dados de uma barbearia.

### Frontend

As rotas do Next.js usam grupos para separar experiências:
- `(public)`: vitrine de agendamento e consulta pública de agendamentos.
- `(dashboard)`: painel autenticado da barbearia.
- `(super-admin)`: painel global de administração.
- `/cadastro` e `/login`: cadastro público de barbearias e autenticação.

Componentes compartilhados ficam em `frontend/src/components/`, incluindo componentes de interface em `components/ui/`.

## 4. Domínio, Planos e Persistência

- **Multi-tenant:** profissionais, serviços e agendamentos pertencem a uma barbearia. As operações protegidas devem limitar leituras e gravações ao tenant associado ao usuário autenticado.
- **Planos:** `barbershops.plan` aceita `solo` ou `equipe`. O padrão no banco é `equipe`.
- **Limite de profissionais ativos:** Solo permite 1 profissional ativo; Equipe permite até 5. A validação acontece na criação e também ao reativar um profissional. As operações de limite usam lock transacional da barbearia para evitar ultrapassar a cota em ações simultâneas.
- **Status da barbearia:** `barbershops.is_active` determina se a vitrine pública está disponível. O Super Admin pode ativar ou desativar uma barbearia; barbearias inativas não entram no MRR e sua vitrine retorna indisponibilidade.
- **E-mails de profissionais:** não são únicos no banco. E-mail de usuário/login continua único.
- **WhatsApp de profissional:** é opcional; se informado, é validado.
- **Agendamentos:** guardam `duration_min` e `price_cents` como snapshot do serviço no momento da marcação. O PostgreSQL tem uma exclusion constraint para impedir sobreposição de agendamentos confirmados do mesmo profissional.
- **Disponibilidade:** calculada com a jornada em `working_hours`, o status ativo do profissional e os agendamentos existentes. A vitrine e a seleção “Qualquer Profissional” consideram apenas profissionais ativos. A criação do agendamento valida novamente o status do profissional.

## 5. Cadastro, Autenticação e Autorização

- O cadastro público `POST /api/v1/barbershops/register` cria a barbearia e o usuário administrador em uma transação, armazena a senha com bcrypt e retorna JWT.
- O login valida a senha e emite JWT com `sub`, `barbershop_id` e `role`.
- O frontend guarda o token no `localStorage`; `frontend/src/lib/api.ts` o envia no header `Authorization: Bearer <token>` quando disponível.
- O plugin global `authPluginGlobal` controla o acesso às rotas. Rotas públicas incluem vitrine, disponibilidade, criação/consulta pública de agendamentos e cadastro de barbearia. As rotas de Super Admin exigem `role = super_admin`.
- A vitrine envia `x-barbershop-id` para operações públicas que precisam identificar o tenant. Quando esse header é usado em listagens públicas de profissionais, ele identifica a barbearia da vitrine mesmo que exista um JWT antigo no navegador.
- O layout do dashboard verifica a autenticação no cliente e redireciona para o login quando necessário. A autorização efetiva também deve ser aplicada no backend.

## 6. Funcionalidades Implementadas

### Vitrine e agendamentos públicos
- Vitrine pública por slug, com serviços e profissionais ativos.
- Fluxo de agendamento em etapas para seleção de profissional, data/horário e dados do cliente.
- Opção “Qualquer Profissional”, limitada à equipe ativa e disponível.
- Consulta e cancelamento público de agendamentos com os dados de gerenciamento correspondentes.
- Barbearias desativadas não podem ser acessadas pela vitrine.

### Painel da barbearia
- Dashboard com indicadores e gráfico dos últimos 12 meses.
- Agenda visual, seleção de visualizações e modal de detalhes/edição/cancelamento.
- Gestão de profissionais, incluindo criação, edição, ativação/desativação e jornada de trabalho.
- Gestão de serviços e clientes.
- WhatsApp opcional no cadastro de profissionais.
- Limites de profissionais ativos por plano validados tanto ao cadastrar quanto ao reativar.

### Planos e Super Admin
- Cadastro público de barbearias com slug gerado automaticamente e seleção entre Solo e Equipe.
- Plano Solo: R$ 49,90/mês e até 1 profissional ativo.
- Plano Equipe: R$ 99,90/mês e até 5 profissionais ativos.
- Super Admin pode listar barbearias, visualizar plano/status e métricas, criar tenants, editar slug e plano e ativar/desativar barbearias.
- O MRR é calculado pelos preços fixos dos planos das barbearias ativas, não pelo faturamento de agendamentos.
- O modal de edição da barbearia mostra o e-mail do administrador como somente leitura.

### Landing page
- Landing page com identidade visual Ink/Bone/Latão, apresentação de recursos, mockup, planos, FAQ e chamadas para cadastro.

## 7. Migrations Relevantes

- `20261029000002_core_tables.sql`: tabelas principais, incluindo profissionais, serviços e barbearias.
- `20261029000003_exclusion_constraint.sql`: proteção contra sobreposição de agendamentos.
- `20261031000001_users.sql`: usuários e papéis.
- `20261103000001_barbershop_plan.sql`: plano da barbearia.
- `20261103000002_barbershop_active.sql`: status ativo da barbearia.
- `20261103000003_professional_email_not_unique.sql`: remoção da unicidade global do e-mail de profissionais.

Use `npm run db:migrate` dentro de `backend` para aplicar migrations pendentes no banco configurado pelo `.env`.

## 8. Diretrizes de Design System

- Paleta visual: Ink, Bone e Brass/Latão, usando tokens semânticos do projeto sempre que possível.
- Painel com tema claro; vitrine e landing page com identidade escura, conforme os estilos existentes.
- Tipografia: Fraunces para títulos de display e Inter/sans-serif para textos de interface.
- Usar componentes Shadcn/UI existentes, respeitando o preset e as APIs já instaladas.
- Exibir estados de carregamento, vazio e erro; erros de operações devem ser comunicados ao usuário, preferencialmente com toast.
- Preservar responsividade, contraste e consistência entre páginas.

## 9. Backlog / Pontos de Atenção

- Confirmar necessidades futuras de relatórios, cobrança recorrente e integração com pagamentos; o MRR atual é uma métrica calculada, não uma cobrança integrada.
- Criar ou ampliar testes automatizados para cadastro, limites de plano (incluindo reativação), indisponibilidade de barbearias inativas e prevenção de conflitos de agenda. Atualmente, o comando de testes do backend pode não encontrar testes automatizados.
- Revisar periodicamente este documento após mudanças relevantes de arquitetura ou regras de negócio.
