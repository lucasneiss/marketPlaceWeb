const slugify = require('slugify');
const { Op, fn, col } = require('sequelize');
const { sequelize, models } = require('../database');
const { formatCurrency, productToView, orderToView } = require('../utils/view');
const { canTransition, TRANSITIONS } = require('../utils/orderStatus');
const { createNotification, emitNotification } = require('../utils/notifications');

const {
    SellerProfile, Product, ProductImage, Category, Order, OrderItem,
    OrderStatusHistory, Review, User,
} = models;

async function getSeller(userId) {
    return SellerProfile.findOne({ where: { userId } });
}

function productPayload(body) {
    const price = Number.parseFloat(String(body.price || '').replace(',', '.'));
    const oldPrice = body.oldPrice ? Number.parseFloat(String(body.oldPrice).replace(',', '.')) : null;
    const quantity = Number.parseInt(body.quantity, 10);
    const discountPercent = body.discountPercent ? Number.parseInt(body.discountPercent, 10) : null;
    return {
        name: String(body.name || '').trim(),
        description: String(body.description || '').trim(),
        categoryId: Number.parseInt(body.categoryId, 10),
        price,
        oldPrice: Number.isFinite(oldPrice) ? oldPrice : null,
        discountPercent: Number.isInteger(discountPercent) ? discountPercent : null,
        quantity: Number.isInteger(quantity) ? quantity : 0,
        imageUrl: String(body.imageUrl || '').trim() || '/images/featured-products.webp',
        imagePosition: ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(body.imagePosition)
            ? body.imagePosition : 'top-left',
        state: ['UNKNOWN', 'GOOD', 'MEDIUM', 'BAD'].includes(body.state) ? body.state : 'GOOD',
        status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
}

async function uniqueSlug(name, currentId = null) {
    const base = slugify(name, { lower: true, strict: true }) || `produto-${Date.now()}`;
    let candidate = base;
    let suffix = 1;
    while (await Product.findOne({ where: { slug: candidate, ...(currentId ? { id: { [Op.ne]: currentId } } : {}) } })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}

async function replaceImages(product, body, transaction) {
    const urls = String(body.additionalImages || '')
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 6);
    await ProductImage.destroy({ where: { productId: product.id, position: { [Op.gt]: 0 } }, transaction });
    if (urls.length) {
        await ProductImage.bulkCreate(urls.map((url, index) => ({
            productId: product.id,
            url,
            altText: `${product.name} - imagem ${index + 2}`,
            position: index + 1,
        })), { transaction });
    }
}

class SellerController {
    static async dashboard(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            if (!seller) return res.status(404).send('Perfil de vendedor não encontrado.');
            if (seller.status !== 'APPROVED') {
                return res.renderComLayout('seller/pending', {
                    titulo: 'Situação da loja | Marketplace', pagina: 'seller', seller,
                });
            }

            const [productCount, activeCount, outOfStockCount, pendingOrderCount, recentOrders, recentReviews, soldItems] = await Promise.all([
                Product.count({ where: { sellerId: seller.id } }),
                Product.count({ where: { sellerId: seller.id, status: 'ACTIVE' } }),
                Product.count({ where: { sellerId: seller.id, quantity: 0 } }),
                Order.count({
                    where: { status: { [Op.in]: ['PENDING', 'CONFIRMED'] } },
                    include: [{ model: OrderItem, as: 'items', where: { sellerId: seller.id }, required: true }],
                    distinct: true,
                }),
                Order.findAll({
                    include: [{ model: OrderItem, as: 'items', where: { sellerId: seller.id }, required: true }],
                    order: [['createdAt', 'DESC']], limit: 5, distinct: true,
                }),
                Review.findAll({
                    include: [
                        { model: Product, as: 'product', where: { sellerId: seller.id }, attributes: ['name'] },
                        { model: User, as: 'client', attributes: ['name'] },
                    ],
                    order: [['createdAt', 'DESC']], limit: 5,
                }),
                OrderItem.findAll({
                    where: { sellerId: seller.id },
                    include: [{ model: Order, as: 'order', where: { status: { [Op.ne]: 'CANCELED' } }, attributes: [] }],
                }),
            ]);
            const unitsSold = soldItems.reduce((sum, item) => sum + item.quantity, 0);
            const salesTotal = soldItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
            return res.renderComLayout('seller/dashboard', {
                titulo: 'Painel do vendedor | Marketplace', pagina: 'seller', seller,
                metrics: { productCount, activeCount, outOfStockCount, pendingOrderCount, unitsSold, salesTotal: formatCurrency(salesTotal) },
                recentOrders: recentOrders.map(orderToView), recentReviews,
            });
        } catch (error) { return next(error); }
    }

    static async showProfile(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            return res.renderComLayout('seller/profile', {
                titulo: 'Perfil da loja | Marketplace', pagina: 'seller', seller, erro: null,
            });
        } catch (error) { return next(error); }
    }

    static async updateProfile(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            seller.storeName = String(req.body.storeName || '').trim();
            seller.description = String(req.body.description || '').trim();
            seller.logoUrl = String(req.body.logoUrl || '').trim() || null;
            if (seller.changed('storeName')) seller.slug = await uniqueSellerSlug(seller.storeName, seller.id);
            await seller.save();
            return res.redirect('/seller/profile?updated=1');
        } catch (error) { return next(error); }
    }

    static async products(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const products = await Product.findAll({
                where: { sellerId: seller.id }, include: [{ model: Category, as: 'category' }], order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('seller/products/list', {
                titulo: 'Meus produtos | Marketplace', pagina: 'seller-products', seller,
                products: products.map(productToView),
            });
        } catch (error) { return next(error); }
    }

    static async newProduct(req, res, next) {
        try {
            const categories = await Category.findAll({ order: [['name', 'ASC']] });
            return res.renderComLayout('seller/products/form', {
                titulo: 'Cadastrar produto | Marketplace', pagina: 'seller-products', product: null, categories, erro: null,
            });
        } catch (error) { return next(error); }
    }

    static async createProduct(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            if (seller.status !== 'APPROVED') return res.status(403).send('A loja ainda não foi aprovada.');
            const payload = productPayload(req.body);
            payload.slug = await uniqueSlug(payload.name);
            payload.sellerId = seller.id;
            const product = await sequelize.transaction(async (transaction) => {
                const created = await Product.create(payload, { transaction });
                await ProductImage.create({
                    productId: created.id, url: created.imageUrl, altText: created.name, position: 0,
                }, { transaction });
                await replaceImages(created, req.body, transaction);
                return created;
            });
            req.app.get('io').emit('catalog:changed', { action: 'created', productId: product.id });
            return res.redirect('/seller/products?created=1');
        } catch (error) { return next(error); }
    }

    static async editProduct(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const product = await Product.findOne({
                where: { id: req.params.id, sellerId: seller.id },
                include: [{ model: ProductImage, as: 'images', order: [['position', 'ASC']] }],
            });
            if (!product) return res.status(403).send('Você não pode editar este produto.');
            const categories = await Category.findAll({ order: [['name', 'ASC']] });
            return res.renderComLayout('seller/products/form', {
                titulo: 'Editar produto | Marketplace', pagina: 'seller-products', product, categories, erro: null,
            });
        } catch (error) { return next(error); }
    }

    static async updateProduct(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const product = await Product.findOne({ where: { id: req.params.id, sellerId: seller.id } });
            if (!product) return res.status(403).send('Você não pode editar este produto.');
            const previousQuantity = product.quantity;
            const payload = productPayload(req.body);
            payload.slug = await uniqueSlug(payload.name, product.id);
            await sequelize.transaction(async (transaction) => {
                await product.update(payload, { transaction });
                await replaceImages(product, req.body, transaction);
                await ProductImage.findOrCreate({
                    where: { productId: product.id, position: 0 },
                    defaults: { url: product.imageUrl, altText: product.name },
                    transaction,
                });
                await ProductImage.update(
                    { url: product.imageUrl, altText: product.name },
                    { where: { productId: product.id, position: 0 }, transaction },
                );
            });
            const io = req.app.get('io');
            io.emit('catalog:changed', { action: 'updated', productId: product.id });
            if (previousQuantity !== product.quantity) io.emit('stock:updated', { productId: product.id, slug: product.slug, quantity: product.quantity });
            return res.redirect('/seller/products?updated=1');
        } catch (error) { return next(error); }
    }

    static async updateStock(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const product = await Product.findOne({ where: { id: req.params.id, sellerId: seller.id } });
            if (!product) return res.status(403).json({ ok: false, message: 'Produto não pertence à sua loja.' });
            const quantity = Number.parseInt(req.body.quantity, 10);
            if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ ok: false, message: 'Estoque inválido.' });
            product.quantity = quantity;
            await product.save();
            req.app.get('io').emit('stock:updated', { productId: product.id, slug: product.slug, quantity });
            return res.json({ ok: true, quantity, lowStock: quantity <= 5 });
        } catch (error) { return next(error); }
    }

    static async toggleProduct(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const product = await Product.findOne({ where: { id: req.params.id, sellerId: seller.id } });
            if (!product) return res.status(403).send('Acesso negado.');
            product.status = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await product.save();
            req.app.get('io').emit('catalog:changed', { action: 'status', productId: product.id, status: product.status });
            return res.redirect('/seller/products');
        } catch (error) { return next(error); }
    }

    static async deleteProduct(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const product = await Product.findOne({ where: { id: req.params.id, sellerId: seller.id } });
            if (!product) return res.status(403).send('Acesso negado.');
            const sold = await OrderItem.count({ where: { productId: product.id } });
            if (sold) {
                product.status = 'INACTIVE';
                await product.save();
            } else {
                await product.destroy();
            }
            req.app.get('io').emit('catalog:changed', { action: sold ? 'deactivated' : 'deleted', productId: product.id });
            return res.redirect('/seller/products');
        } catch (error) { return next(error); }
    }

    static async orders(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const orders = await Order.findAll({
                include: [{ model: OrderItem, as: 'items', where: { sellerId: seller.id }, required: true }],
                order: [['createdAt', 'DESC']], distinct: true,
            });
            return res.renderComLayout('seller/orders/list', {
                titulo: 'Pedidos recebidos | Marketplace', pagina: 'seller-orders', orders: orders.map(orderToView),
            });
        } catch (error) { return next(error); }
    }

    static async orderDetails(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const order = await Order.findOne({
                where: { id: req.params.id },
                include: [
                    { model: User, as: 'client', attributes: ['name', 'email'] },
                    { model: OrderItem, as: 'items', where: { sellerId: seller.id }, required: true },
                    { model: OrderStatusHistory, as: 'history', include: [{ model: User, as: 'actor', attributes: ['name'] }] },
                ],
                order: [[{ model: OrderStatusHistory, as: 'history' }, 'createdAt', 'ASC']],
            });
            if (!order) return res.status(403).send('Este pedido não contém produtos da sua loja.');
            const view = orderToView(order);
            view.items = order.items.map((item) => ({
                ...item.get({ plain: true }),
                formattedUnitPrice: formatCurrency(item.unitPrice),
                formattedSubtotal: formatCurrency(Number(item.unitPrice) * item.quantity),
            }));
            return res.renderComLayout('seller/orders/details', {
                titulo: `Pedido ${order.number} | Marketplace`, pagina: 'seller-orders', order: view,
                allowedTransitions: TRANSITIONS[order.status] || [],
            });
        } catch (error) { return next(error); }
    }

    static async updateOrderStatus(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const newStatus = String(req.body.status || '');
            const order = await Order.findOne({
                where: { id: req.params.id },
                include: [{ model: OrderItem, as: 'items', where: { sellerId: seller.id }, required: true }],
            });
            if (!order) return res.status(403).json({ ok: false, message: 'Pedido não autorizado.' });
            if (!canTransition(order.status, newStatus)) {
                return res.status(400).json({ ok: false, message: 'Transição de estado inválida.' });
            }
            const previousStatus = order.status;
            let notification;
            const stockChanges = [];
            await sequelize.transaction(async (transaction) => {
                order.status = newStatus;
                await order.save({ transaction });

                if (newStatus === 'CANCELED') {
                    const allItems = await OrderItem.findAll({ where: { orderId: order.id }, transaction });
                    for (const item of allItems) {
                        if (!item.productId) continue;
                        const product = await Product.findByPk(item.productId, { transaction });
                        if (!product) continue;
                        product.quantity += item.quantity;
                        await product.save({ transaction });
                        stockChanges.push({ productId: product.id, slug: product.slug, quantity: product.quantity });
                    }
                }

                await OrderStatusHistory.create({
                    orderId: order.id,
                    previousStatus,
                    newStatus,
                    actorId: req.session.userId,
                    observation: String(req.body.observation || '').trim().slice(0, 255) || null,
                }, { transaction });
                notification = await createNotification({
                    userId: order.clientId,
                    message: `O pedido ${order.number} agora está: ${orderToView(order).statusLabel}.`,
                    type: 'ORDER_STATUS',
                    url: `/orders/${order.id}`,
                    transaction,
                });
            });
            const io = req.app.get('io');
            emitNotification(io, notification.userId, notification);
            stockChanges.forEach((change) => io.emit('stock:updated', change));
            io.to(`user:${order.clientId}`).emit('order:status', {
                orderId: order.id, number: order.number, status: order.status, statusLabel: orderToView(order).statusLabel,
            });
            return res.json({ ok: true, status: order.status, statusLabel: orderToView(order).statusLabel });
        } catch (error) { return next(error); }
    }

    static async reviews(req, res, next) {
        try {
            const seller = await getSeller(req.session.userId);
            const reviews = await Review.findAll({
                include: [
                    { model: Product, as: 'product', where: { sellerId: seller.id }, attributes: ['name', 'slug'] },
                    { model: User, as: 'client', attributes: ['name'] },
                ],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('seller/reviews', {
                titulo: 'Avaliações recebidas | Marketplace', pagina: 'seller-reviews', reviews,
            });
        } catch (error) { return next(error); }
    }
}

async function uniqueSellerSlug(name, currentId) {
    const base = slugify(name, { lower: true, strict: true }) || `loja-${Date.now()}`;
    let candidate = base;
    let suffix = 1;
    while (await SellerProfile.findOne({ where: { slug: candidate, id: { [Op.ne]: currentId } } })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
    }
    return candidate;
}

module.exports = SellerController;
