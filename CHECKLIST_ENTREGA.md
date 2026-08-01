# Checklist do trabalho

## Situação geral

O código cobre os módulos obrigatórios do enunciado. A execução real ainda deve ser validada no computador do grupo com `npm install`, `npm run db:reset`, `npm start` e o roteiro de `TESTE_MANUAL.md`.

## Tecnologias

- [x] Node.js e Express — `app.js`.
- [x] EJS — `src/views`.
- [x] jQuery e AJAX — `public/js`.
- [x] Sequelize e SQLite — `src/database` e `src/models`.
- [x] Socket.IO — `app.js`, `public/js/realtime.js`.
- [x] Bootstrap — `src/views/layout.ejs`.
- [ ] Validar instalação e execução no computador do grupo.

## Usuários e autorização

- [x] Visitante, cliente, vendedor e administrador.
- [x] Cadastro, login, logout e sessão.
- [x] Senhas com hash bcrypt.
- [x] Proteção no servidor por autenticação, perfil e situação da loja.
- [x] Cliente não acessa administração.
- [x] Vendedor só altera produtos próprios.
- [x] Vendedor só consulta pedidos que contêm produtos próprios.
- [x] Apenas cliente de pedido entregue avalia item comprado.
- [x] Respostas 401, 403, 404 e 500.

## Módulos públicos

- [x] Página inicial.
- [x] Catálogo com busca textual.
- [x] Filtros por categoria, preço, vendedor e disponibilidade.
- [x] Ordenação por preço, nome e data.
- [x] Paginação no servidor.
- [x] Detalhes, imagens, vendedor, estoque, avaliações e relacionados.
- [x] Perfil público do vendedor.

## Cliente

- [x] Perfil, senha e endereços.
- [x] Carrinho com adicionar, atualizar e remover por AJAX.
- [x] Subtotais e total recalculados no servidor.
- [x] Validação de estoque e produto ativo.
- [x] Checkout com endereço, entrega e pagamento simulados.
- [x] Criação do pedido em transação Sequelize.
- [x] Itens históricos do pedido.
- [x] Redução e restauração do estoque.
- [x] Histórico de estados.
- [x] Cancelamento em sequência coerente.
- [x] Avaliação de compra entregue, uma por item.
- [x] Notificações.

## Vendedor

- [x] Perfil da loja e aprovação administrativa.
- [x] Painel com produtos, ativos, sem estoque, pedidos a processar, unidades e valor de vendas.
- [x] Produtos próprios: cadastrar, editar, estoque, desativar e excluir quando permitido.
- [x] Imagem principal e imagens adicionais por URL.
- [x] Pedidos relacionados e alteração controlada de estado.
- [x] Avaliações recebidas.
- [x] Notificação de nova venda.

## Administrador

- [x] Painel com métricas gerais.
- [x] Usuários: bloquear e desbloquear.
- [x] Vendedores: pendente, aprovado e suspenso.
- [x] Categorias: criar, editar e excluir quando vazia.
- [x] Produtos: ocultar e reativar.
- [x] Pedidos: listagem e detalhes.
- [x] Avaliações: aprovação e ocultação por AJAX.

## Tempo real

- [x] Notificações pessoais em tempo real.
- [x] Estado do pedido em tempo real.
- [x] Estoque sincronizado nas páginas abertas.
- [x] Avisos de alteração do catálogo.
- [ ] Demonstrar com dois usuários em navegadores diferentes.

## jQuery

- [x] Mais de cinco manipulações relevantes do DOM.
- [x] Pelo menos três operações AJAX; a verificação estática detecta oito.
- [x] Carrinho, estoque, pedidos, notificações e moderação.

## Banco

- [x] Entidades obrigatórias e entidades auxiliares.
- [x] 1:1, 1:N e N:N.
- [x] Chaves estrangeiras e unicidade.
- [x] Validações e timestamps.
- [x] Tabela associativa com atributos próprios.
- [x] Consultas com associações.
- [x] Métricas e consultas agregadas.
- [x] Dados iniciais de demonstração.

## Entregáveis ainda externos ao código

- [ ] Repositório atualizado com branches, commits reais e pull requests.
- [ ] Relação entre integrantes e logins do GitHub.
- [ ] `historico_commits.txt` gerado a partir do repositório final.
- [ ] Apresentação em PDF.
- [ ] Vídeo de demonstração.
- [ ] ZIP final criado a partir da versão aprovada na `main`.
