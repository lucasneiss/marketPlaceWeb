# Marketplace Web

Aplicação acadêmica de marketplace multiusuário desenvolvida com Node.js, Express, EJS, jQuery, Sequelize, SQLite, Bootstrap e Socket.IO.

O sistema permite navegação pública, cadastro de clientes e vendedores, compra simulada, gerenciamento de produtos e estoque, acompanhamento de pedidos, avaliações moderadas e administração da plataforma.

## Como executar

### Requisitos

- Node.js 20.17 ou superior;
- npm;
- navegador atualizado.

### Instalação

```bash
npm install
```

Crie o arquivo de configuração local:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**Linux/macOS**

```bash
cp .env.example .env
```

O arquivo `.env` é carregado por um utilitário local, sem biblioteca adicional. As configurações padrão também permitem executar o projeto sem criar esse arquivo.

### Criar o banco e os dados de demonstração

```bash
npm run db:reset
```

### Iniciar

```bash
npm start
```

Acesse `http://localhost:3000`.

Durante o desenvolvimento, também é possível usar:

```bash
npm run dev
```

## Contas de demonstração

Todas usam a senha `Marketplace@123`, salvo alteração da variável `SEED_DEMO_PASSWORD`.

| Tipo | E-mail |
|---|---|
| Administrador | `admin@marketplace.local` |
| Cliente | `cliente@marketplace.local` |
| Vendedor | `vendedor@marketplace.local` |
| Vendedor | `estilo@marketplace.local` |
| Vendedor | `aurora@marketplace.local` |

## Funcionalidades

### Visitante

- página inicial, catálogo, busca, filtros, ordenação e paginação;
- detalhes do produto, avaliações e produtos relacionados;
- perfil público dos vendedores;
- cadastro e login.

### Cliente

- edição de perfil e senha;
- endereços;
- carrinho com atualização assíncrona;
- checkout e compra simulada;
- consulta de pedidos e histórico de estados;
- cancelamento dentro da sequência permitida;
- avaliação de itens de pedidos entregues;
- notificações.

### Vendedor

- perfil público da loja;
- painel com métricas agregadas;
- cadastro, edição, desativação e exclusão segura de produtos;
- atualização assíncrona de estoque;
- consulta dos pedidos que contêm produtos próprios;
- atualização controlada do estado do pedido;
- consulta das avaliações recebidas;
- notificação de novas vendas.

### Administrador

- painel geral;
- bloqueio e desbloqueio de usuários;
- aprovação, suspensão e reanálise de vendedores;
- gerenciamento de categorias;
- ocultação e reativação de produtos;
- acompanhamento de pedidos;
- moderação assíncrona de avaliações.

## Tempo real

O Socket.IO foi usado em duas categorias de funcionalidade:

1. **Notificações:** nova venda, alteração de estado, situação da loja e cancelamento.
2. **Sincronização:** atualização do estoque e avisos de mudanças no catálogo sem depender de uma nova requisição da página aberta.

Para demonstrar, abra dois navegadores ou uma janela normal e outra anônima. Entre como cliente em uma e como vendedor na outra.

## jQuery e AJAX

As principais operações assíncronas estão em `public/js`:

- adicionar produto ao carrinho;
- alterar quantidade;
- remover item;
- marcar notificações como lidas;
- marcar todas as notificações como lidas;
- atualizar estoque do vendedor;
- atualizar estado do pedido;
- moderar avaliações.

Os valores e permissões são sempre validados novamente no servidor.

## Banco de dados

Principais entidades:

- `User`, `Role` e `UserRole`;
- `Address` e `SellerProfile`;
- `Category`, `Product` e `ProductImage`;
- `Cart` e `CartItem`;
- `Order`, `OrderItem` e `OrderStatusHistory`;
- `Review` e `Notification`.

Exemplos de relacionamentos:

- 1:1 — usuário e carrinho; usuário e perfil de vendedor;
- 1:N — vendedor e produtos; pedido e itens; produto e avaliações;
- N:N — usuários e perfis de acesso por meio de `UserRole`;
- tabela associativa com atributos — `UserRole`, com data e responsável pela atribuição;
- tabela de item com dados históricos — `OrderItem` preserva nome, preço, quantidade, desconto e vendedor do momento da compra.

## Estrutura principal

```text
app.js
public/
  css/
  images/
  js/
src/
  controllers/
  database/
  middlewares/
  models/
  routes/
  utils/
  views/
scripts/
```

## Verificações

A checagem estática não precisa das dependências instaladas:

```bash
npm run check
```

Depois da instalação, execute também:

```bash
npm run db:reset
npm run db:check
npm start
```

Em seguida, faça o roteiro de `TESTE_MANUAL.md`.

## Endpoints principais

### Públicos e autenticação

| Método | Endpoint | Função |
|---|---|---|
| GET | `/` | Página inicial |
| GET | `/catalog` | Catálogo, filtros e paginação |
| GET | `/products/:slug` | Detalhes do produto |
| GET | `/sellers/:slug` | Perfil público do vendedor |
| GET/POST | `/register` | Cadastro |
| GET/POST | `/login` | Login |
| GET/POST | `/logout` | Logout |
| GET/POST | `/profile` | Perfil autenticado |
| GET/POST | `/change-password` | Alteração de senha |

### Cliente

| Método | Endpoint | Função |
|---|---|---|
| GET | `/addresses` | Listar endereços |
| GET/POST | `/addresses/new`, `/addresses` | Criar endereço |
| GET/POST | `/addresses/:id/edit`, `/addresses/:id` | Editar endereço |
| POST | `/addresses/:id/delete` | Excluir endereço |
| GET | `/cart` | Carrinho |
| POST | `/cart/items` | Adicionar item via AJAX |
| PATCH | `/cart/items/:id` | Atualizar quantidade via AJAX |
| DELETE | `/cart/items/:id` | Remover item via AJAX |
| GET/POST | `/checkout` | Revisão e criação do pedido |
| GET | `/orders` | Histórico de pedidos |
| GET | `/orders/:id` | Detalhes e histórico |
| POST | `/orders/:id/cancel` | Cancelamento permitido |
| POST | `/orders/:orderId/items/:itemId/review` | Avaliação verificada |
| GET | `/notifications` | Notificações |
| PATCH | `/notifications/:id/read` | Marcar uma como lida |
| PATCH | `/notifications/read-all` | Marcar todas como lidas |

### Vendedor

| Método | Endpoint | Função |
|---|---|---|
| GET | `/seller` | Painel |
| GET/POST | `/seller/profile` | Perfil da loja |
| GET | `/seller/products` | Produtos próprios |
| GET/POST | `/seller/products/new`, `/seller/products` | Cadastro |
| GET/POST | `/seller/products/:id/edit`, `/seller/products/:id` | Edição autorizada |
| PATCH | `/seller/products/:id/stock` | Estoque via AJAX |
| POST | `/seller/products/:id/toggle` | Ativar/desativar |
| POST | `/seller/products/:id/delete` | Excluir ou desativar se já vendido |
| GET | `/seller/orders` | Pedidos relacionados |
| GET | `/seller/orders/:id` | Detalhes relacionados |
| PATCH | `/seller/orders/:id/status` | Estado via AJAX |
| GET | `/seller/reviews` | Avaliações recebidas |

### Administrador

| Método | Endpoint | Função |
|---|---|---|
| GET | `/admin` | Painel |
| GET/POST | `/admin/users`, `/admin/users/:id/toggle` | Usuários |
| GET/POST | `/admin/sellers`, `/admin/sellers/:id/status` | Vendedores |
| GET/POST | `/admin/categories` | Categorias |
| POST | `/admin/categories/:id` | Editar categoria |
| POST | `/admin/categories/:id/delete` | Excluir categoria sem produtos |
| GET | `/admin/products` | Produtos |
| POST | `/admin/products/:id/toggle` | Ocultar/reativar produto |
| GET | `/admin/orders` | Pedidos |
| GET | `/admin/orders/:id` | Detalhes do pedido |
| GET | `/admin/reviews` | Avaliações |
| PATCH | `/admin/reviews/:id/status` | Moderação via AJAX |

## Colaboração no GitHub

Não envie a pasta `node_modules`, o banco local nem o arquivo `.env`. Eles já estão cobertos por `.gitignore`.

Use uma branch criada a partir da `main` atualizada, revise as alterações, faça commits verdadeiros e abra um pull request. O roteiro completo está em `GITHUB_PASSO_A_PASSO.md`.

Não invente, retroceda ou compacte artificialmente o histórico. Cada integrante deve testar e melhorar partes reais do sistema, deixando contribuições identificáveis.
