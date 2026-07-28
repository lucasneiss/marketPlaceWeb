const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const db = require('./src/database'); // Importa o banco e modelos
const authRoutes = require('./src/routes/authRoutes'); // 1. IMPORTA AS ROTAS DE AUTENTICAÇÃO
const productRoutes = require('./src/routes/productRoutes');

const PORTA = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuração de Views ajustada para buscar dentro de src/views
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve os arquivos estáticos (CSS, JS) da pasta public

app.use(session({
    secret: 'segredo_marketplace',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.renderComLayout = function (view, dados = {}) {
        const dadosEscopo = {
            username: req.session ? req.session.username : null,

            pagina: '',
            anoAtual: new Date().getFullYear(),

            ...res.locals,
            ...dados
        };

        res.render(view, dadosEscopo, (erro, html) => {
            if (erro) return next(erro);
            res.render('layout', {
                ...dadosEscopo,
                body: html
            });
        });
    };
    next();
});

app.use('/', authRoutes);
app.use(productRoutes);

// Rota não encontrada (404) - precisa vir depois de todas as outras rotas
app.use((req, res) => {
    res.status(404);

    return res.renderComLayout(
        'errors/404',
        {
            titulo: 'Página não encontrada | Marketplace',
            pagina: 'error',
        },
    );
});

// Erro interno (500) - sempre por último
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500);
    return res.renderComLayout(
        'errors/500',
        {
            titulo: 'Erro interno | Marketplace',
            pagina: 'error',
        },
    );
});

db.sequelize.authenticate()
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
        server.listen(PORTA, () => console.log('Servidor rodando na porta ' + PORTA));
    })
    .catch((error) => {
        console.error('Erro ao conectar ao banco de dados:', error);
    });


