# Roteiro de teste manual

## Preparação

```bash
npm install
npm run db:reset
npm start
```

Abra:

- uma janela normal como cliente;
- uma janela anônima como vendedor;
- outra janela anônima ou outro navegador como administrador.

Senha das contas demo: `Marketplace@123`.

## 1. Visitante

1. Abrir a página inicial.
2. Pesquisar um produto.
3. Abrir o catálogo.
4. Testar categoria, preço, vendedor, disponibilidade, ordenação e paginação.
5. Abrir detalhes de um produto e o perfil público do vendedor.
6. Confirmar que tentativa de acessar `/cart`, `/seller` e `/admin` sem permissão resulta em 401 ou 403.

## 2. Cliente

1. Entrar com `cliente@marketplace.local`.
2. Editar perfil e trocar senha; se trocar a senha demo, reinicie o banco depois do teste.
3. Criar, editar e excluir um endereço.
4. Adicionar produto ao carrinho sem recarregar a página.
5. Alterar quantidade e remover item sem recarregar.
6. Tentar quantidade maior que o estoque.
7. Finalizar a compra com endereço, entrega e pagamento simulados.
8. Abrir o pedido e conferir itens, preço, endereço e histórico.
9. Cancelar um pedido ainda permitido e confirmar a devolução ao estoque.
10. No pedido demo entregue, conferir que existe no máximo uma avaliação por item.

## 3. Vendedor

1. Entrar com `vendedor@marketplace.local` ou `estilo@marketplace.local`.
2. Conferir métricas do painel.
3. Criar um produto.
4. Editar nome, categoria, preço, imagens, estado e estoque.
5. Atualizar o estoque pela listagem e confirmar a alteração assíncrona.
6. Desativar e reativar o próprio produto.
7. Tentar editar manualmente o ID de um produto pertencente a outro vendedor; o servidor deve negar.
8. Abrir pedidos recebidos e atualizar o estado somente pela sequência oferecida.
9. Conferir avaliações recebidas.

## 4. Administrador

1. Entrar com `admin@marketplace.local`.
2. Conferir as métricas.
3. Bloquear e desbloquear um usuário.
4. Aprovar ou suspender uma loja.
5. Criar e editar categoria.
6. Confirmar que categoria com produtos não pode ser excluída.
7. Ocultar e reativar produto.
8. Abrir pedidos e seus históricos.
9. Aprovar ou ocultar uma avaliação e conferir a média do produto.

## 5. Tempo real

### Nova venda

1. Deixar o vendedor conectado em uma janela.
2. No cliente, criar um pedido com produto desse vendedor.
3. Confirmar que o vendedor recebe uma notificação sem recarregar.

### Estado do pedido

1. Deixar o cliente na tela do pedido.
2. No vendedor, alterar o estado do pedido.
3. Confirmar a atualização e a notificação na janela do cliente.

### Estoque

1. Deixar o cliente na página de detalhes de um produto.
2. No vendedor, alterar o estoque.
3. Confirmar que o estoque exibido ao cliente muda sem recarregar.

## 6. Segurança e consistência

1. Cliente não acessa painel administrativo.
2. Vendedor não edita produto de outro vendedor.
3. Loja pendente ou suspensa não acessa gerenciamento de produtos e pedidos.
4. Produto de loja suspensa não pode ser colocado no carrinho nem comprado.
5. Preço final vem do banco, não do navegador.
6. Compra acima do estoque é recusada.
7. Estoque nunca fica negativo.
8. Avaliação exige compra entregue.
9. Usuário não acessa pedido ou endereço de outro usuário alterando o ID na URL.
10. Páginas inexistentes retornam a tela 404.

## Registro de resultados

| Data | Integrante | Cenário | Resultado | Correção/commit |
|---|---|---|---|---|
|  |  |  |  |  |
