function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next(); // deixa passar
    }
    res.status(401);
    return res.renderComLayout(
        'errors/401',
        {
            titulo: 'Autenticação necessária | Marketplace',
            pagina: 'error',
        },
    );
}

function requireRole(...rolesPermitidos) {
    return async (req, res, next) => {
        const { models } = require('../database');

        const user = await models.User.findByPk(req.session.userId, {
            include: [{ model: models.Role, as: 'roles' }],
        });

        const cargosDoUsuario = user.roles.map(r => r.code);
        const temPermissao = rolesPermitidos.some(r => cargosDoUsuario.includes(r));

        if (!temPermissao) {
            res.status(403);

            return res.renderComLayout(
                'errors/403',
                {
                    titulo: 'Acesso negado | Marketplace',
                    pagina: 'error',
                },
            );
        }
    }
}

module.exports = { requireAuth, requireRole };