# Contexto do Projeto: Cadeira Livre

## 1. Visão Geral
O Cadeira Livre é uma plataforma SaaS (Software as a Service) multi-tenant voltada para o gerenciamento de agendamentos em barbearias. O grande diferencial técnico do projeto é o controle rigoroso de concorrência e isolamento de dados, resolvido diretamente no nível do banco de dados relacional para evitar *double-booking* (agendamento duplo).

## 2. Stack Tecnológica
O projeto adota uma arquitetura de monorepo dividida em duas pastas principais: `backend` e `frontend`.

**Backend:**
- Runtime: Node.js (>= 24) com TypeScript nativo (ESM).
- Framework HTTP: Fastify 5.
- Banco de Dados: PostgreSQL 16 (rodando via Docker).
- Query Builder: `postgres.js` (SQL puro, sem ORM, para controle total das constraints).
- Validação: Zod.
- Migrações: DBMate.
- Autenticação: JWT (@fastify/jwt) e Bcrypt.

**Frontend:**
- Framework: Next.js 16 (App Router, Turbopack).
- Estilização: Tailwind CSS v4.
- Componentes: Shadcn UI (Nova preset) e Lucide React (ícones).
- Validação de Formulários: React Hook Form + Zod.
- Utilitários de Data: date-fns.

## 3. Arquitetura e Padrões

### Backend (DDD + Vertical Slices)
O código não é dividido por camadas (Controllers, Models), mas sim por domínios (fatias verticais). Toda a lógica de um módulo fica em `src/modules/[nome-do-modulo]/`:
- `dtos/`: Validação de entrada (Zod).
- `database/`: Repositório com queries SQL puras.
- `domain/`: Regras de negócio puramente matemáticas/lógicas.
- `*.routes.ts`: Recepção HTTP e amarração.

### Frontend (Route Groups)
O Next.js utiliza Route Groups para separar contextos visuais:
- `(public)`: Rotas da vitrine do cliente (Tema Escuro, sem login).
- `(dashboard)`: Rotas do painel do barbeiro (Tema Claro, protegidas por autenticação).
- `/login`: Rota isolada de autenticação.

## 4. Modelagem de Dados e Segurança
O banco de dados é a linha de defesa mais forte do sistema.
- **Multi-Tenant:** Tabelas como `professionals`, `services` e `appointments` possuem a coluna `barbershop_id`. As queries sempre filtram por este ID para garantir que uma barbearia não acesse dados de outra.
- **EXCLUDE CONSTRAINT:** A tabela `appointments` utiliza uma restrição de exclusão do PostgreSQL (`EXCLUDE USING gist`) com `tstzrange`. Isso torna fisicamente impossível que dois agendamentos confirmados (`status = 'confirmed'`) para o mesmo profissional se sobreponham no tempo.
- **Snapshot Pattern:** A tabela `appointments` armazena `duration_min` e `price_cents` no momento da criação. Se o preço do serviço mudar no futuro, o histórico do agendamento permanece intacto.
- **Jornada de Trabalho:** A disponibilidade não é engessada no código. É calculada cruzando as tabelas `working_hours` (dias e horários de cada profissional) e `time_off` (férias/bloqueios).

## 5. Autenticação e Autorização
- **Fluxo:** O usuário faz login via e-mail/senha. O backend valida a senha (Bcrypt) e gera um token JWT contendo `sub`, `barbershop_id` e `role`.
- **Transporte:** O token é retornado no JSON e salvo no `localStorage` do frontend (devido a restrições de CORS e Cookies em ambiente de desenvolvimento com portas diferentes).
- **Autorização:** O arquivo `frontend/src/lib/api.ts` injeta o token em todas as requisições como `Authorization: Bearer <token>`. 
- **Proteção de Rotas:**
  - No backend: O plugin global (`authPluginGlobal` com `fastify-plugin`) intercepta todas as requisições, valida o JWT e ignora rotas públicas (vitrine e login).
  - No frontend: O arquivo `(dashboard)/layout.tsx` verifica a existência do token no `localStorage` e redireciona para o login se não existir.

## 6. Status Atual do Desenvolvimento

### O que já está implementado:
- [x] Setup do Docker, DBMate e Postgres.
- [x] Constraints de exclusão de tempo no banco.
- [x] Endpoints de listagem e criação para Serviços e Profissionais.
- [x] Cálculo dinâmico de disponibilidade (fuso horário incluso).
- [x] Criação de agendamento com tratamento de erro 409 (Conflito de horário).
- [x] Fluxo de agendamento do cliente (Modal em 4 etapas com resumo e tela de sucesso).
- [x] Tela de Login e proteção do dashboard.
- [x] Criação de Serviços e Profissionais pelo painel (usando Bearer Token).
- [x] Agenda Visual (Timeline) para o barbeiro com posicionamento matemático dos blocos de horário.

### O que precisa ser feito (Backlog):
- [ ] **Configuração de Jornada de Trabalho:** Criar interface no painel para o barbeiro definir os dias e horários do profissional (o backend já suporta).
- [ ] **Edição e Exclusão (CRUD Completo):** Adicionar botões de editar e excluir nas tabelas de Serviços e Equipe. A exclusão deve ser via *soft delete* (mudar `is_active` para `false`).
- [ ] **Badges de Status:** Substituir textos simples por selos visuais (ex: "Ativo" verde, "Inativo" vermelho) nas tabelas.
- [ ] **Alternador de Tema (Dark/Light Mode):** Implementar `next-themes` com um botão no cabeçalho para o usuário escolher o tema (o design system já está preparado para ambos).
- [ ] **Módulo de Cancelamento:** Interface no painel para o barbeiro cancelar agendamentos.

## 7. Diretrizes de Design System
- **Cores:** Baseado na paleta "Brass, Bone, Ink". O tema claro (painel) usa fundo `bone` e a cor primária `brass` (latão). O tema escuro (cliente) usa fundo `ink` com detalhes em latão.
- **Tipografia:** Títulos em `Fraunces` (serifada) e corpo em `Inter` (sans-serif), carregadas via `next/font`.
- **Feedback Visual:** Uso de Toasts (Sonner) para notificações de sucesso/erro no painel e Overlays de carregamento com efeito *glassmorphism* (`backdrop-blur`).