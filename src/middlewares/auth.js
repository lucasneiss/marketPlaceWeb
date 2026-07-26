function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next(); // deixa passar
    }
    return res.status(401).render('errors/401');
}

function requireRole(...rolesPermitidos) {
    return async (req, res, next) => {
        const { models } = require('../database');

        const user = await models.User.findByPk(req.session.userId, {
            include: [{ model: models.Role, as: 'roles' }],
        });

        const cargosDoUsuario = user.roles.map(r => r.code);
        const temPermissao = rolesPermitidos.some(r => cargosDoUsuario.includes(r));

        if (temPermissao) {
            return next();
        }
        return res.status(403).render('errors/403');
    };
}

module.exports = { requireAuth, requireRole };