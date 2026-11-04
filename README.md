# 🪑 Cadeira Livre - SaaS de Agendamento Multi-Tenant

O **Cadeira Livre** é uma plataforma SaaS (Software as a Service) completa para gestão de agendamentos em barbearias e clínicas. O sistema foi projetado para ser multi-tenant, permitindo que várias barbearias utilizem a mesma infraestrutura com isolamento total de dados, controle de planos de assinatura e uma interface premium.

## 🚀 Diferenciais Técnicos

O grande destaque deste projeto é a robustez do backend e a modelagem de dados, indo muito além de um CRUD básico:

- **Zero Double-Booking (Nível de Banco):** Para garantir que dois clientes jamais agendem o mesmo horário com o mesmo profissional, não dependemos apenas de lógica de aplicação. Utilizamos uma **EXCLUDE CONSTRAINT** nativa do PostgreSQL com `tstzrange` e `btree_gist`. Mesmo sob concorrência extrema, o banco de dados bloqueia agendamentos sobrepostos.
- **Arquitetura Multi-Tenant (B2B e B2C):** O sistema separa perfeitamente o contexto do Barbeiro (Painel Autenticado via JWT) e do Cliente Final (Vitrine Pública isolada por `slug`).
- **Snapshot Pattern:** O valor e a duração do serviço são gravados no momento do agendamento. Se o barbeiro mudar o preço do corte amanhã, o histórico do agendamento de ontem continuará correto.
- **SaaS Master (Super Admin):** Visão global do faturamento do SaaS (MRR), gestão de tenants (ativar/desativar), controle de planos (Solo/Equipe) e limites de profissionais impostos diretamente pelo backend.

## 📸 Screenshots

**Landing Page**
[Insira o print da Landing Page aqui]

**Painel do Barbeiro (Dashboard / Agenda)**
[Insira o print do Dashboard aqui]

**Vitrine do Cliente**
[Insira o print da Vitrine aqui]

## 🛠️ Stack Tecnológica

**Backend:**
- Node.js (>= 24) com TypeScript Nativo (ESM)
- Fastify 5
- PostgreSQL 16
- postgres.js (SQL Puro para controle das constraints)
- DBMate (Migrations)
- Zod (Validação de dados)
- JWT + Bcrypt

**Frontend:**
- Next.js 16 (App Router + Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4 + Shadcn UI
- React Hook Form + Zod
- react-big-calendar
- next-themes (Dark/Light Mode)

**Infraestrutura & Integrações:**
- Docker
- Cloudinary (Upload de logos)

## 🧠 Arquitetura e Padrões

### Backend (DDD + Vertical Slices)
O backend é dividido por domínios (fatias verticais). Toda a lógica de um módulo (`services`, `professionals`, `appointments`) reside em sua própria pasta, contendo suas rotas, repositórios (SQL puro) e regras de negócio.

### Banco de Dados
- Isolamento via `barbershop_id` em todas as queries.
- Soft Delete (`is_active = false`) para preservar históricos.
- Cálculo de disponibilidade (`/availability`) respeitando fusos horários, jornada de trabalho e bloqueios pontuais.

## ⚙️ Como rodar o projeto localmente

**Pré-requisitos:** Node.js (v24+), Docker e DBMate.

1. Clone o repositório:

git clone https://github.com/leolop3sdev520/cadeira-livre-saas.git
cd cadeira-livre-saas

2. Suba o banco de dados:

docker compose up -d

3. Configure o Backend:

cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed:dev
npm run dev

4. Configure o Frontend:

cd ../frontend
cp .env.example .env.local
npm install
npm run dev

5. Acesse:
- Vitrine: http://localhost:3000/barbearia-do-ze
- Painel: http://localhost:3000/login (Usuário: ze@barbearia.com / Senha: senha123)
- Super Admin: http://localhost:3000/login (Usuário: admin@cadeiralivre.com / Senha: admin123)

## 👨‍💻 Autor

Desenvolvido por **Leo Lopes**.
- [GitHub](https://github.com/leolop3sdev520)
