const { models } = require('../database');

async function loadCurrentUser(req, res, next) {
    res.locals.currentUser = null;
    res.locals.userRoles = [];
    res.locals.isClient = false;
    res.locals.isSeller = false;
    res.locals.isAdmin = false;
    res.locals.unreadNotifications = 0;
    res.locals.cartCount = 0;

    if (!req.session?.userId) {
        return next();
    }

    try {
        const user = await models.User.findByPk(req.session.userId, {
            include: [{ model: models.Role, as: 'roles', through: { attributes: [] } }],
        });

        if (!user || user.status === 'BLOCKED') {
            req.session.destroy(() => {});
            return next();
        }

        const roles = user.roles.map((role) => role.code);
        const unreadNotifications = await models.Notification.count({
            where: { userId: user.id, read: false },
        });
        let cartCount = 0;
        if (roles.includes('CLIENT')) {
            const cart = await models.Cart.findOne({
                where: { userId: user.id },
                include: [{ model: models.CartItem, as: 'items', attributes: ['quantity'] }],
            });
            cartCount = (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0);
        }

        req.currentUser = user;
        req.userRoles = roles;
        req.session.username = user.name;

        res.locals.currentUser = user;
        res.locals.username = user.name;
        res.locals.userRoles = roles;
        res.locals.isClient = roles.includes('CLIENT');
        res.locals.isSeller = roles.includes('SELLER');
        res.locals.isAdmin = roles.includes('ADMIN');
        res.locals.unreadNotifications = unreadNotifications;
        res.locals.cartCount = cartCount;

        return next();
    } catch (error) {
        return next(error);
    }
}

function requireAuth(req, res, next) {
    if (req.session?.userId && req.currentUser) {
        return next();
    }

    res.status(401);
    return res.renderComLayout('errors/401', {
        titulo: 'Autenticação necessária | Marketplace',
        pagina: 'error',
    });
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.session?.userId || !req.currentUser) {
            res.status(401);
            return res.renderComLayout('errors/401', {
                titulo: 'Autenticação necessária | Marketplace',
                pagina: 'error',
            });
        }

        const hasPermission = allowedRoles.some((role) => req.userRoles.includes(role));
        if (!hasPermission) {
            res.status(403);
            return res.renderComLayout('errors/403', {
                titulo: 'Acesso negado | Marketplace',
                pagina: 'error',
            });
        }

        return next();
    };
}

async function requireApprovedSeller(req, res, next) {
    try {
        const seller = await models.SellerProfile.findOne({
            where: { userId: req.session?.userId },
        });

        if (!seller || seller.status !== 'APPROVED') {
            res.status(403);
            return res.renderComLayout('errors/403', {
                titulo: 'Loja sem autorização | Marketplace',
                pagina: 'error',
            });
        }

        req.sellerProfile = seller;
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = { loadCurrentUser, requireAuth, requireRole, requireApprovedSeller };
