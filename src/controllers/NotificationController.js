const { models } = require('../database');
const { Notification } = models;

class NotificationController {
    static async list(req, res, next) {
        try {
            const notifications = await Notification.findAll({
                where: { userId: req.session.userId },
                order: [['createdAt', 'DESC']],
            });
            res.renderComLayout('notifications', { titulo: 'Notificações', notifications });
        } catch (error) {
            next(error);
        }
    }

    static async markAsRead(req, res, next) {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification || notification.userId !== req.session.userId) {
                return res.status(403).render('errors/403');
            }
            notification.read = true;
            await notification.save();
            res.redirect('/notifications');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = NotificationController;