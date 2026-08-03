const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const db = require('./src/database');
const { loadCurrentUser } = require('./src/middlewares/auth');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const sellerRoutes = require('./src/routes/sellerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');
app.set('io', io);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'segredo_marketplace_altere_em_producao',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8,
    },
});

app.use(sessionMiddleware);
app.use((req, res, next) => {
    res.renderComLayout = function renderComLayout(view, data = {}) {
        const scope = {
            username: req.session?.username || null,
            pagina: '',
            anoAtual: new Date().getFullYear(),
            query: req.query || {},
            erro: null,
            ...res.locals,
            ...data,
        };

        res.render(view, scope, (error, html) => {
            if (error) return next(error);
            return res.render('layout', { ...scope, body: html });
        });
    };
    next();
});
app.use(loadCurrentUser);

io.engine.use(sessionMiddleware);
io.on('connection', (socket) => {
    const userId = socket.request.session?.userId;
    if (userId) socket.join(`user:${userId}`);
});

app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);
app.use('/', sellerRoutes);
app.use('/', adminRoutes);

app.use((req, res) => {
    res.status(404);
    return res.renderComLayout('errors/404', {
        titulo: 'Página não encontrada | Marketplace',
        pagina: 'error',
    });
});

app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    res.status(500);
    return res.renderComLayout('errors/500', {
        titulo: 'Erro interno | Marketplace',
        pagina: 'error',
    });
});

async function start() {
    await db.connectDatabase();
    await db.sequelize.sync();
    server.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

start().catch((error) => {
    console.error('Erro ao iniciar o servidor:', error);
    process.exitCode = 1;
});
