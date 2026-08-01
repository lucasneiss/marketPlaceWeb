const { models } = require('../database');
const { formatCurrency, productToView } = require('../utils/view');

const { Cart, CartItem, Product, Category, SellerProfile } = models;

function quantityFrom(value, fallback = 1) {
    const quantity = Number.parseInt(value, 10);
    return Number.isInteger(quantity) && quantity > 0 ? Math.min(quantity, 999) : fallback;
}

async function getCart(userId) {
    const [cart] = await Cart.findOrCreate({ where: { userId } });
    return Cart.findByPk(cart.id, {
        include: [{
            model: CartItem,
            as: 'items',
            include: [{
                model: Product,
                as: 'product',
                include: [
                    { model: Category, as: 'category' },
                    { model: SellerProfile, as: 'seller' },
                ],
            }],
        }],
        order: [[{ model: CartItem, as: 'items' }, 'createdAt', 'ASC']],
    });
}

function cartToView(cart) {
    const items = (cart?.items || []).map((item) => {
        const product = productToView(item.product);
        const subtotal = Number(item.quantity) * Number(product.price);
        return {
            id: item.id,
            quantity: item.quantity,
            product,
            subtotal,
            formattedSubtotal: formatCurrency(subtotal),
            valid: product.status === 'ACTIVE'
                && product.seller?.status === 'APPROVED'
                && product.quantity >= item.quantity,
        };
    });
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    return {
        id: cart?.id,
        items,
        total,
        formattedTotal: formatCurrency(total),
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        canCheckout: items.length > 0 && items.every((item) => item.valid),
    };
}

class CartController {
    static async show(req, res, next) {
        try {
            const cart = cartToView(await getCart(req.session.userId));
            return res.renderComLayout('cart/index', {
                titulo: 'Meu carrinho | Marketplace', pagina: 'cart', cart,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async add(req, res, next) {
        try {
            const productId = Number.parseInt(req.body.productId, 10);
            const quantity = quantityFrom(req.body.quantity);
            const product = await Product.findByPk(productId, {
                include: [{ model: SellerProfile, as: 'seller', attributes: ['id', 'status'] }],
            });
            if (!product || product.status !== 'ACTIVE' || product.seller?.status !== 'APPROVED') {
                return res.status(404).json({ ok: false, message: 'Produto não encontrado ou desativado.' });
            }
            if (product.quantity < quantity) {
                return res.status(400).json({ ok: false, message: 'Quantidade superior ao estoque disponível.' });
            }

            const [cart] = await Cart.findOrCreate({ where: { userId: req.session.userId } });
            const [item, created] = await CartItem.findOrCreate({
                where: { cartId: cart.id, productId }, defaults: { quantity },
            });
            if (!created) {
                const newQuantity = item.quantity + quantity;
                if (newQuantity > product.quantity) {
                    return res.status(400).json({ ok: false, message: 'O carrinho ultrapassaria o estoque disponível.' });
                }
                item.quantity = newQuantity;
                await item.save();
            }
            const view = cartToView(await getCart(req.session.userId));
            return res.json({ ok: true, message: 'Produto adicionado ao carrinho.', cartCount: view.count });
        } catch (error) {
            return next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const item = await CartItem.findOne({
                where: { id: req.params.id },
                include: [
                    { model: Cart, as: 'cart', where: { userId: req.session.userId } },
                    { model: Product, as: 'product' },
                ],
            });
            if (!item) return res.status(404).json({ ok: false, message: 'Item não encontrado.' });
            const quantity = quantityFrom(req.body.quantity, 0);
            if (!quantity || quantity > item.product.quantity) {
                return res.status(400).json({ ok: false, message: 'Quantidade inválida para o estoque atual.' });
            }
            item.quantity = quantity;
            await item.save();
            const cart = cartToView(await getCart(req.session.userId));
            const updated = cart.items.find((current) => current.id === item.id);
            return res.json({
                ok: true,
                itemSubtotal: updated.formattedSubtotal,
                total: cart.formattedTotal,
                cartCount: cart.count,
                canCheckout: cart.canCheckout,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async remove(req, res, next) {
        try {
            const item = await CartItem.findOne({
                where: { id: req.params.id },
                include: [{ model: Cart, as: 'cart', where: { userId: req.session.userId } }],
            });
            if (!item) return res.status(404).json({ ok: false, message: 'Item não encontrado.' });
            await item.destroy();
            const cart = cartToView(await getCart(req.session.userId));
            return res.json({ ok: true, total: cart.formattedTotal, cartCount: cart.count, empty: cart.items.length === 0 });
        } catch (error) {
            return next(error);
        }
    }
}

CartController.getCart = getCart;
CartController.cartToView = cartToView;
module.exports = CartController;
