1. 🎯 Objetivo do Sistema

Sistema SaaS multi-tenant para pequenas e médias empresas gerenciarem:

Vendas

Estoque

Clientes

Contas a receber (vendas a prazo)

Dashboard com métricas

Alertas de vencimentos e estoque baixo

Cada empresa deve acessar apenas seus próprios dados.

2. 🧱 Stack Oficial (Não alterar)

Next.js 14+ (App Router)

TypeScript

TailwindCSS

shadcn/ui

Prisma ORM

PostgreSQL

Auth.js (NextAuth)

Zod (validação)

React Hook Form

Recharts (gráficos)

3. 🏗 Arquitetura Obrigatória

Separação em camadas:

UI (app/)
→ Route Handler (app/api/)
→ Service (server/services/)
→ Prisma (lib/db)

❌ Regras:

Nunca colocar regra de negócio em componente React

Nunca acessar Prisma direto na UI

Nunca consultar dados sem tenantId

Nunca criar tabela sem tenantId

4. 📂 Estrutura de Pastas
src/
 ├── app/
 │    ├── (auth)/
 │    │     ├── login/
 │    │     └── register/
 │    ├── (dashboard)/
 │    │     ├── layout.tsx
 │    │     ├── page.tsx
 │    │     ├── sales/
 │    │     ├── inventory/
 │    │     ├── customers/
 │    │     ├── receivables/
 │    │     └── settings/
 │    └── api/
 │
 ├── components/
 │    ├── layout/
 │    ├── ui/
 │    └── charts/
 │
 ├── lib/
 │    ├── db.ts
 │    ├── auth.ts
 │    └── validators/
 │
 ├── server/
 │    ├── services/
 │    │     ├── sales.service.ts
 │    │     ├── inventory.service.ts
 │    │     ├── dashboard.service.ts
 │    │     └── receivables.service.ts
 │
 └── prisma/
      └── schema.prisma

5. 🏢 Multi-Tenant (Obrigatório)

Modelo: tenantId em todas as tabelas.

Fluxo:

Usuário pertence a um Tenant

Toda consulta deve filtrar por tenantId

Middleware valida sessão e tenant ativo

6. 🗄 Modelo de Banco de Dados (Prisma)
model Tenant {
  id        String   @id @default(uuid())
  name      String
  users     Membership[]
  products  Product[]
  customers Customer[]
  sales     Sale[]
  createdAt DateTime @default(now())
}

model User {
  id          String        @id @default(uuid())
  name        String?
  email       String        @unique
  password    String
  memberships Membership[]
  createdAt   DateTime      @default(now())
}

model Membership {
  id        String @id @default(uuid())
  userId    String
  tenantId  String
  role      String
  user      User   @relation(fields: [userId], references: [id])
  tenant    Tenant @relation(fields: [tenantId], references: [id])
}

model Product {
  id        String   @id @default(uuid())
  name      String
  price     Float
  stock     Int
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}

model Customer {
  id        String   @id @default(uuid())
  name      String
  phone     String?
  email     String?
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}

model Sale {
  id        String      @id @default(uuid())
  total     Float
  tenantId  String
  tenant    Tenant      @relation(fields: [tenantId], references: [id])
  items     SaleItem[]
  createdAt DateTime    @default(now())
}

model SaleItem {
  id        String   @id @default(uuid())
  saleId    String
  productId String
  quantity  Int
  price     Float
  sale      Sale     @relation(fields: [saleId], references: [id])
}

model Receivable {
  id        String   @id @default(uuid())
  saleId    String
  amount    Float
  dueDate   DateTime
  status    String
  tenantId  String
  createdAt DateTime @default(now())
}

7. 🔄 Fluxos Principais
Venda

Criar venda

Adicionar itens

Baixar estoque

Se a prazo → criar Receivable

Estoque

Entrada

Saída

Ajuste manual

Alerta se stock < limite

Contas a Receber

Listar vencidos

Listar a vencer

Marcar como pago

8. 📊 Dashboard (MVP)

Cards:

Faturamento do mês

Vendas do dia

Ticket médio

Produtos com estoque baixo

Contas vencidas

Gráficos:

Vendas por dia

Top 5 produtos

9. 🎨 Layout UI

Padrão obrigatório:

Sidebar fixa (desktop)

Drawer mobile

Topbar com perfil

Cards com sombra leve

Espaçamento consistente

Responsivo mobile-first

Modo claro/escuro

Usar shadcn/ui para:

Card

Table

Dialog

Dropdown

Sheet

Badge

10. 🗺 Roadmap de Implementação
Sprint 1

Setup projeto

Auth

Tenant

Layout base

Sprint 2

Produtos (CRUD)

Clientes (CRUD)

Sprint 3

Estoque + movimentações

Sprint 4

Vendas + baixa automática

Sprint 5

Receivables + alertas

Sprint 6

Dashboard

11. 🔒 Regras de Segurança

Hash de senha obrigatório

Middleware protegendo rotas

Validação Zod em todas entradas

Nunca retornar dados sem filtrar tenantId

Variáveis sensíveis no .env

12. 🚀 Primeira Tarefa para o Codex

Depois de criar este arquivo, enviar:

Leia o SPEC.md e implemente o scaffold inicial do projeto com:

Layout responsivo

Auth funcionando

Prisma conectado

Models Tenant, User e Membership

Middleware protegendo dashboard