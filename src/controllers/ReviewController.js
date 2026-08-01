const { models } = require('../database');
const { createNotification, emitNotification } = require('../utils/notifications');

const { Review, OrderItem, Order, SellerProfile } = models;

class ReviewController {
    static async create(req, res, next) {
        try {
            const orderItem = await OrderItem.findOne({
                where: { id: req.params.itemId, orderId: req.params.orderId },
                include: [
                    { model: Order, as: 'order', where: { clientId: req.session.userId, status: 'DELIVERED' } },
                    { model: Review, as: 'review', required: false },
                    { model: SellerProfile, as: 'seller' },
                ],
            });
            if (!orderItem) return res.status(403).send('Somente produtos de pedidos entregues podem ser avaliados.');
            if (orderItem.review) return res.status(409).send('Este item já foi avaliado.');

            const rating = Number.parseInt(req.body.rating, 10);
            const comment = String(req.body.comment || '').trim();
            if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3) {
                return res.status(400).send('Nota ou comentário inválido.');
            }

            await Review.create({
                clientId: req.session.userId,
                productId: orderItem.productId,
                orderItemId: orderItem.id,
                rating,
                comment,
                status: 'PENDING',
            });

            const notification = await createNotification({
                userId: orderItem.seller.userId,
                message: `Uma nova avaliação aguarda moderação para ${orderItem.productName}.`,
                type: 'REVIEW_CREATED',
                url: '/seller/reviews',
            });
            emitNotification(req.app.get('io'), notification.userId, notification);
            return res.redirect(`/orders/${orderItem.orderId}?reviewed=1`);
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).send('Este item já foi avaliado.');
            return next(error);
        }
    }
}

module.exports = ReviewController;
