const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const { Usuario } = require('./db');
const PORTA = 3000;
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuração da Sessão
app.use(session({
    secret: 'segredo_super_seguro_do_stop',
    resave: false,
    saveUninitialized: false
}));

// Rota Raiz (Redireciona para o lobby se estiver logado, ou para o login se não estiver)
app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/lobby');
    }
    res.redirect('/login');
});


// Middleware do Layout (Deixado antes das rotas para que todas possam usar)
app.use((req, res, next) => {
    res.renderComLayout = function (view, dados = {}) {
        // Garante que o username da sessão esteja sempre disponível para o layout.ejs
        const dadosEscopo = {
            username: req.session ? req.session.username : null,
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

server.listen(PORTA, () => console.log('Servidor rodando na porta '+ PORTA));

