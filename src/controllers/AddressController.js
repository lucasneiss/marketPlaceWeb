const { models } = require('../database');
const { Address } = models;

class AddressController {
    static async list(req, res, next) {
        try {
            const addresses = await Address.findAll({ where: { userId: req.session.userId } });
            res.renderComLayout('addresses/list', { titulo: 'Meus endereços', addresses });
        } catch (error) {
            next(error);
        }
    }

    static showNew(req, res) {
        res.renderComLayout('addresses/form', { titulo: 'Novo endereço', address: null });
    }

    static async showEdit(req, res, next) {
        try {
            const address = await Address.findByPk(req.params.id);
            if (!address || address.userId !== req.session.userId) {
                return res.status(403).render('errors/403');
            }
            res.renderComLayout('addresses/form', { titulo: 'Editar endereço', address });
        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            await Address.create({ ...req.body, userId: req.session.userId });
            res.redirect('/addresses');
        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const address = await Address.findByPk(req.params.id);
            if (!address || address.userId !== req.session.userId) {
                return res.status(403).render('errors/403');
            }
            await address.update(req.body);
            res.redirect('/addresses');
        } catch (error) {
            next(error);
        }
    }

    static async destroy(req, res, next) {
        try {
            const address = await Address.findByPk(req.params.id);
            if (!address || address.userId !== req.session.userId) {
                return res.status(403).render('errors/403');
            }
            await address.destroy();
            res.redirect('/addresses');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AddressController;