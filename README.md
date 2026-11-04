# 🪑 Cadeira Livre - SaaS de Agendamento Multi-Tenant

O **Cadeira Livre** é uma plataforma SaaS (Software as a Service) completa para gestão de agendamentos em barbearias e clínicas. O sistema foi projetado para ser multi-tenant, permitindo que várias barbearias utilizem a mesma infraestrutura com isolamento total de dados, controle de planos de assinatura e uma interface premium.

## 🚀 Diferenciais Técnicos

O grande destaque deste projeto é a robustez do backend e a modelagem de dados, indo muito além de um CRUD básico:

*   **Zero Double-Booking (Nível de Banco):** Para garantir que dois clientes jamais agendem o mesmo horário com o mesmo profissional, não dependemos apenas de lógica de aplicação. Utilizamos uma **`EXCLUDE CONSTRAINT`** nativa do PostgreSQL com `tstzrange` e `btree_gist`. Mesmo sob concorrência extrema, o banco de dados bloqueia agendamentos sobrepostos.
*   **Arquitetura Multi-Tenant (B2B e B2C):** O sistema separa perfeitamente o contexto do Barbeiro (Painel Autenticado via JWT) e do Cliente Final (Vitrine Pública isolada por `slug`).
*   **Snapshot Pattern:** O valor e a duração do serviço são gravados no momento do agendamento. Se o barbeiro mudar o preço do corte amanhã, o histórico do agendamento de ontem continuará correto.
*   **SaaS Master (Super Admin):** Visão global do faturamento do SaaS (MRR), gestão de tenants (ativar/desativar), controle de planos (Solo/Equipe) e limites de profissionais impostos diretamente pelo backend.

## 📸 Screenshots

| Landing Page (Foco em Conversão) | Painel do Barbeiro (Dark Mode) |
| :---: | :---: |
| *[Insira o print da Landing Page aqui]* | *[Insira o print da Agenda/Dashboard aqui]* |

| Vitrine do Cliente (Mobile-First) | Fluxo de Agendamento |
| :---: | :---: |
| *[Insira o print da Vitrine aqui]* | *[Insira o print do modal de agendamento aqui]* |

## 🛠️ Stack Tecnológica

**Backend:**
*   Node.js (>= 24) com TypeScript Nativo (ESM)
*   Fastify 5 (Alta performance e Schema Validation)
*   PostgreSQL 16 (Banco de Dados Relacional)
*   `postgres.js` (SQL Puro para máximo controle das constraints)
*   DBMate (Migrations)
*   Zod (Validação de dados)
*   JWT (`@fastify/jwt`) + Bcrypt

**Frontend:**
*   Next.js 16 (App Router + Turbopack)
*   React 19 + TypeScript
*   Tailwind CSS v4 + Shadcn UI
*   React Hook Form + Zod
*   `react-big-calendar` (Agenda visual)
*   `next-themes` (Dark/Light Mode)

**Infraestrutura & Integrações:**
*   Docker (Ambiente de banco de dados)
*   Cloudinary (Upload de logos via Stream)

## 🧠 Arquitetura e Padrões

### Backend (DDD + Vertical Slices)
O backend não é dividido por camadas genéricas, mas sim por domínios (fatias verticais). Toda a lógica de um módulo (`services`, `professionals`, `appointments`) reside em sua própria pasta, contendo suas rotas, repositórios (SQL puro) e regras de negócio.

### Banco de Dados
O coração do projeto. A modelagem garante a integridade das informações através de:
*   Isolamento via `barbershop_id` em todas as queries.
*   Soft Delete (`is_active = false`) para preservar históricos.
*   Cálculo de disponibilidade (`/availability`) respeitando fusos horários, jornada de trabalho (`working_hours`) e bloqueios pontuais (`time_off`).

## ⚙️ Como rodar o projeto localmente

### Pré-requisitos
*   Node.js (v24+)
*   Docker e Docker Compose
*   DBMate instalado (`npm install -g dbmate`)

### Passo a Passo

1. Clone o repositório:
```bash
git clone https://github.com/leolop3sdev520/cadeira-livre-saas.git
cd cadeira-livre-saas
