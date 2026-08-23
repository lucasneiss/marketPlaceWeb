const slugify = require('slugify');
const { Op } = require('sequelize');
const { models } = require('../database');
const { formatCurrency, orderToView, productToView } = require('../utils/view');
const { createNotification, emitNotification } = require('../utils/notifications');
const { recalculateProductRating } = require('../utils/reviews');

const { User, Role, SellerProfile, Category, Product, Order, OrderItem, OrderStatusHistory, Review } = models;

class AdminController {
    static async dashboard(req, res, next) {
        try {
            const [users, clients, sellers, products, orders, inactiveProducts, pendingReviews, recentOrders] = await Promise.all([
                User.count(),
                User.count({
                    include: [{ model: Role, as: 'roles', where: { code: 'CLIENT' }, through: { attributes: [] } }],
                    distinct: true,
                }),
                SellerProfile.count(),
                Product.count(),
                Order.count(),
                Product.count({ where: { status: 'INACTIVE' } }),
                Review.count({ where: { status: 'PENDING' } }),
                Order.findAll({ order: [['createdAt', 'DESC']], limit: 8 }),
            ]);
            return res.renderComLayout('admin/dashboard', {
                titulo: 'Painel administrativo | Marketplace', pagina: 'admin',
                metrics: { users, clients, sellers, products, orders, inactiveProducts, pendingReviews },
                recentOrders: recentOrders.map(orderToView),
            });
        } catch (error) { return next(error); }
    }

    static async users(req, res, next) {
        try {
            const users = await User.findAll({
                include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('admin/users', {
                titulo: 'Gerenciar usuários | Marketplace', pagina: 'admin-users', users,
            });
        } catch (error) { return next(error); }
    }

    static async toggleUser(req, res, next) {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) return res.status(404).send('Usuário não encontrado.');
            if (user.id === req.session.userId) return res.status(400).send('Você não pode bloquear sua própria conta.');
            user.status = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
            user.blockedAt = user.status === 'BLOCKED' ? new Date() : null;
            await user.save({ hooks: false });
            return res.redirect('/admin/users');
        } catch (error) { return next(error); }
    }

    static async sellers(req, res, next) {
        try {
            const sellers = await SellerProfile.findAll({
                include: [{ model: User, as: 'user', attributes: ['name', 'email', 'status'] }],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('admin/sellers', {
                titulo: 'Gerenciar vendedores | Marketplace', pagina: 'admin-sellers', sellers,
            });
        } catch (error) { return next(error); }
    }

    static async sellerStatus(req, res, next) {
        try {
            const status = ['PENDING', 'APPROVED', 'SUSPENDED'].includes(req.body.status) ? req.body.status : null;
            const seller = await SellerProfile.findByPk(req.params.id);
            if (!seller || !status) return res.status(400).send('Dados inválidos.');
            seller.status = status;
            seller.approvedAt = status === 'APPROVED' ? new Date() : seller.approvedAt;
            await seller.save();
            const notification = await createNotification({
                userId: seller.userId,
                message: status === 'APPROVED'
                    ? 'Sua loja foi aprovada e já pode cadastrar produtos.'
                    : status === 'SUSPENDED'
                        ? 'Sua loja foi suspensa pela administração.'
                        : 'Sua loja está aguardando análise.',
                type: 'SELLER_STATUS',
                url: '/seller',
            });
            emitNotification(req.app.get('io'), seller.userId, notification);
            return res.redirect('/admin/sellers');
        } catch (error) { return next(error); }
    }

    static async categories(req, res, next) {
        try {
            const categories = await Category.findAll({
                include: [{ model: Product, as: 'products', attributes: ['id'] }],
                order: [['name', 'ASC']],
            });
            return res.renderComLayout('admin/categories', {
                titulo: 'Gerenciar categorias | Marketplace', pagina: 'admin-categories', categories, erro: null,
            });
        } catch (error) { return next(error); }
    }

    static async createCategory(req, res, next) {
        try {
            const name = String(req.body.name || '').trim();
            const description = String(req.body.description || '').trim() || null;
            if (name.length < 2) return res.status(400).send('Nome inválido.');
            await Category.create({ name, description, slug: slugify(name, { lower: true, strict: true }) });
            return res.redirect('/admin/categories');
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).send('Categoria já existente.');
            return next(error);
        }
    }

    static async updateCategory(req, res, next) {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) return res.status(404).send('Categoria não encontrada.');
            category.name = String(req.body.name || '').trim();
            category.description = String(req.body.description || '').trim() || null;
            category.slug = slugify(category.name, { lower: true, strict: true });
            await category.save();
            return res.redirect('/admin/categories');
        } catch (error) { return next(error); }
    }

    static async deleteCategory(req, res, next) {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) return res.status(404).send('Categoria não encontrada.');
            const products = await Product.count({ where: { categoryId: category.id } });
            if (products) return res.status(409).send('Não é possível excluir uma categoria com produtos.');
            await category.destroy();
            return res.redirect('/admin/categories');
        } catch (error) { return next(error); }
    }

    static async products(req, res, next) {
        try {
            const products = await Product.findAll({
                include: [{ model: Category, as: 'category' }, { model: SellerProfile, as: 'seller' }],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('admin/products', {
                titulo: 'Gerenciar produtos | Marketplace', pagina: 'admin-products', products: products.map(productToView),
            });
        } catch (error) { return next(error); }
    }

    static async toggleProduct(req, res, next) {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) return res.status(404).send('Produto não encontrado.');
            product.status = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await product.save();
            req.app.get('io').emit('catalog:changed', { action: 'status', productId: product.id, status: product.status });
            return res.redirect('/admin/products');
        } catch (error) { return next(error); }
    }


    static async orders(req, res, next) {
        try {
            const orders = await Order.findAll({
                include: [
                    { model: User, as: 'client', attributes: ['name', 'email'] },
                    { model: OrderItem, as: 'items' },
                ],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('admin/orders/list', {
                titulo: 'Acompanhar pedidos | Marketplace',
                pagina: 'admin-orders',
                orders: orders.map(orderToView),
            });
        } catch (error) { return next(error); }
    }

    static async orderDetails(req, res, next) {
        try {
            const order = await Order.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'client', attributes: ['name', 'email'] },
                    { model: OrderItem, as: 'items' },
                    { model: OrderStatusHistory, as: 'history', include: [{ model: User, as: 'actor', attributes: ['name'] }] },
                ],
                order: [[{ model: OrderStatusHistory, as: 'history' }, 'createdAt', 'ASC']],
            });
            if (!order) return res.status(404).send('Pedido não encontrado.');
            const view = orderToView(order);
            view.items = order.items.map((item) => ({
                ...item.get({ plain: true }),
                formattedUnitPrice: formatCurrency(item.unitPrice),
                formattedSubtotal: formatCurrency(Number(item.unitPrice) * item.quantity),
            }));
            return res.renderComLayout('admin/orders/details', {
                titulo: `Pedido ${order.number} | Marketplace`,
                pagina: 'admin-orders',
                order: view,
            });
        } catch (error) { return next(error); }
    }

    static async reviews(req, res, next) {
        try {
            const reviews = await Review.findAll({
                include: [
                    { model: Product, as: 'product', attributes: ['name', 'slug'] },
                    { model: User, as: 'client', attributes: ['name', 'email'] },
                ],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('admin/reviews', {
                titulo: 'Moderar avaliações | Marketplace', pagina: 'admin-reviews', reviews,
            });
        } catch (error) { return next(error); }
    }

    static async reviewStatus(req, res, next) {
        try {
            const status = ['PENDING', 'APPROVED', 'HIDDEN'].includes(req.body.status) ? req.body.status : null;
            const review = await Review.findByPk(req.params.id);
            if (!review || !status) return res.status(400).json({ ok: false, message: 'Dados inválidos.' });
            review.status = status;
            await review.save();
            await recalculateProductRating(review.productId);
            req.app.get('io').emit('review:updated', { productId: review.productId, reviewId: review.id, status });
            return res.json({ ok: true, status });
        } catch (error) { return next(error); }
    }
}

module.exports = AdminController;
