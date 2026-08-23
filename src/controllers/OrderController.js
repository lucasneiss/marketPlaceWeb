const { sequelize, models } = require('../database');
const CartController = require('./CartController');
const { formatCurrency, orderToView } = require('../utils/view');
const { canTransition } = require('../utils/orderStatus');
const { createNotification, emitNotification } = require('../utils/notifications');

const {
    Address, Cart, CartItem, Product, SellerProfile, Order, OrderItem,
    OrderStatusHistory, Review, User,
} = models;

const SHIPPING = { STANDARD: 20, EXPRESS: 45, PICKUP: 0 };

function generateOrderNumber(userId) {
    return `MP-${Date.now()}-${userId}-${Math.floor(Math.random() * 1000)}`;
}

function itemToView(item) {
    const plain = typeof item.get === 'function' ? item.get({ plain: true }) : item;
    const subtotal = Number(plain.unitPrice) * plain.quantity - Number(plain.discount || 0);
    return { ...plain, subtotal, formattedUnitPrice: formatCurrency(plain.unitPrice), formattedSubtotal: formatCurrency(subtotal) };
}

class OrderController {
    static async checkout(req, res, next) {
        try {
            const [addresses, cartData] = await Promise.all([
                Address.findAll({ where: { userId: req.session.userId }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] }),
                CartController.getCart(req.session.userId),
            ]);
            const cart = CartController.cartToView(cartData);
            if (!cart.items.length) return res.redirect('/cart');
            if (!cart.canCheckout) return res.redirect('/cart?invalid=1');
            return res.renderComLayout('checkout/index', {
                titulo: 'Finalizar compra | Marketplace', pagina: 'checkout', addresses, cart,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async create(req, res, next) {
        const addressId = Number.parseInt(req.body.addressId, 10);
        const paymentMethod = ['PIX', 'CREDIT_CARD', 'BANK_SLIP'].includes(req.body.paymentMethod)
            ? req.body.paymentMethod : null;
        const deliveryMethod = ['STANDARD', 'EXPRESS', 'PICKUP'].includes(req.body.deliveryMethod)
            ? req.body.deliveryMethod : null;
        if (!addressId || !paymentMethod || !deliveryMethod) {
            return res.status(400).send('Dados de checkout inválidos.');
        }

        try {
            const result = await sequelize.transaction(async (transaction) => {
                const address = await Address.findOne({ where: { id: addressId, userId: req.session.userId }, transaction });
                if (!address) throw Object.assign(new Error('Endereço inválido.'), { status: 400 });

                const cart = await Cart.findOne({
                    where: { userId: req.session.userId },
                    include: [{
                        model: CartItem,
                        as: 'items',
                        include: [{ model: Product, as: 'product', include: [{ model: SellerProfile, as: 'seller' }] }],
                    }],
                    transaction,
                });
                if (!cart?.items?.length) throw Object.assign(new Error('O carrinho está vazio.'), { status: 400 });

                let productsTotal = 0;
                for (const item of cart.items) {
                    if (!item.product || item.product.status !== 'ACTIVE' || item.product.seller?.status !== 'APPROVED') {
                        throw Object.assign(new Error(`O produto ${item.product?.name || ''} está indisponível.`), { status: 400 });
                    }
                    if (item.quantity > item.product.quantity) {
                        throw Object.assign(new Error(`Estoque insuficiente para ${item.product.name}.`), { status: 400 });
                    }
                    productsTotal += Number(item.product.price) * item.quantity;
                }

                const shippingPrice = SHIPPING[deliveryMethod];
                const order = await Order.create({
                    number: generateOrderNumber(req.session.userId),
                    clientId: req.session.userId,
                    addressId: address.id,
                    recipientName: address.recipientName,
                    postalCode: address.postalCode,
                    street: address.street,
                    addressNumber: address.number,
                    complement: address.complement,
                    neighborhood: address.neighborhood,
                    city: address.city,
                    state: address.state,
                    paymentMethod,
                    deliveryMethod,
                    shippingPrice,
                    total: productsTotal + shippingPrice,
                    status: 'PENDING',
                }, { transaction });

                const sellerUserIds = new Set();
                const stockChanges = [];
                for (const item of cart.items) {
                    const product = item.product;
                    await OrderItem.create({
                        orderId: order.id,
                        productId: product.id,
                        sellerId: product.sellerId,
                        productName: product.name,
                        sellerName: product.seller.storeName,
                        unitPrice: product.price,
                        quantity: item.quantity,
                        discount: 0,
                        imageUrl: product.imageUrl,
                    }, { transaction });
                    product.quantity -= item.quantity;
                    await product.save({ transaction });
                    stockChanges.push({ productId: product.id, slug: product.slug, quantity: product.quantity });
                    sellerUserIds.add(product.seller.userId);
                }

                await OrderStatusHistory.create({
                    orderId: order.id,
                    previousStatus: null,
                    newStatus: 'PENDING',
                    actorId: req.session.userId,
                    observation: 'Pedido criado pelo cliente.',
                }, { transaction });

                await CartItem.destroy({ where: { cartId: cart.id }, transaction });
                const notifications = [];
                notifications.push(await createNotification({
                    userId: req.session.userId,
                    message: `Pedido ${order.number} criado com sucesso.`,
                    type: 'ORDER_CREATED',
                    url: `/orders/${order.id}`,
                    transaction,
                }));
                for (const sellerUserId of sellerUserIds) {
                    notifications.push(await createNotification({
                        userId: sellerUserId,
                        message: `Nova venda no pedido ${order.number}.`,
                        type: 'NEW_SALE',
                        url: `/seller/orders/${order.id}`,
                        transaction,
                    }));
                }
                return { order, notifications, stockChanges };
            });

            const io = req.app.get('io');
            result.notifications.forEach((notification) => emitNotification(io, notification.userId, notification));
            result.stockChanges.forEach((change) => io.emit('stock:updated', change));
            return res.redirect(`/orders/${result.order.id}?created=1`);
        } catch (error) {
            if (error.status === 400) return res.status(400).send(error.message);
            return next(error);
        }
    }

    static async list(req, res, next) {
        try {
            const orders = await Order.findAll({
                where: { clientId: req.session.userId },
                include: [{ model: OrderItem, as: 'items' }],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('orders/list', {
                titulo: 'Meus pedidos | Marketplace', pagina: 'orders', orders: orders.map(orderToView),
            });
        } catch (error) {
            return next(error);
        }
    }

    static async show(req, res, next) {
        try {
            const order = await Order.findOne({
                where: { id: req.params.id, clientId: req.session.userId },
                include: [
                    { model: OrderItem, as: 'items', include: [{ model: Review, as: 'review', required: false }] },
                    {
                        model: OrderStatusHistory,
                        as: 'history',
                        include: [{ model: User, as: 'actor', attributes: ['name'] }],
                    },
                ],
                order: [[{ model: OrderStatusHistory, as: 'history' }, 'createdAt', 'ASC']],
            });
            if (!order) {
                res.status(404);
                return res.renderComLayout('errors/404', { titulo: 'Pedido não encontrado | Marketplace' });
            }
            const view = orderToView(order);
            view.items = order.items.map(itemToView);
            return res.renderComLayout('orders/details', {
                titulo: `Pedido ${order.number} | Marketplace`, pagina: 'order-details', order: view,
                canCancel: ['PENDING', 'CONFIRMED'].includes(order.status),
            });
        } catch (error) {
            return next(error);
        }
    }

    static async cancel(req, res, next) {
        try {
            const result = await sequelize.transaction(async (transaction) => {
                const order = await Order.findOne({
                    where: { id: req.params.id, clientId: req.session.userId },
                    include: [{ model: OrderItem, as: 'items' }],
                    transaction,
                });
                if (!order) throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 });
                if (!canTransition(order.status, 'CANCELED')) throw Object.assign(new Error('Este pedido não pode mais ser cancelado.'), { status: 400 });
                const previousStatus = order.status;
                order.status = 'CANCELED';
                await order.save({ transaction });
                const stockChanges = [];
                const sellerIds = new Set();
                for (const item of order.items) {
                    sellerIds.add(item.sellerId);
                    if (!item.productId) continue;
                    const product = await Product.findByPk(item.productId, { transaction });
                    if (product) {
                        product.quantity += item.quantity;
                        await product.save({ transaction });
                        stockChanges.push({ productId: product.id, slug: product.slug, quantity: product.quantity });
                    }
                }
                await OrderStatusHistory.create({
                    orderId: order.id, previousStatus, newStatus: 'CANCELED', actorId: req.session.userId,
                    observation: String(req.body.observation || 'Cancelado pelo cliente.').slice(0, 255),
                }, { transaction });

                const sellerProfiles = await SellerProfile.findAll({
                    where: { id: [...sellerIds] },
                    attributes: ['userId'],
                    transaction,
                });
                const notifications = [];
                for (const seller of sellerProfiles) {
                    notifications.push(await createNotification({
                        userId: seller.userId,
                        message: `O pedido ${order.number} foi cancelado pelo cliente.`,
                        type: 'ORDER_CANCELED',
                        url: `/seller/orders/${order.id}`,
                        transaction,
                    }));
                }
                return { order, stockChanges, notifications };
            });
            const io = req.app.get('io');
            result.stockChanges.forEach((change) => io.emit('stock:updated', change));
            result.notifications.forEach((notification) => emitNotification(io, notification.userId, notification));
            return res.redirect(`/orders/${result.order.id}`);
        } catch (error) {
            if (error.status === 404) return res.status(404).send(error.message);
            if (error.status === 400) return res.status(400).send(error.message);
            return next(error);
        }
    }
}

module.exports = OrderController;
