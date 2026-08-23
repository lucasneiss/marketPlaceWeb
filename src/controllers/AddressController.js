const { sequelize, models } = require('../database');
const { Address } = models;

function addressPayload(body) {
    return {
        label: String(body.label || '').trim(),
        recipientName: String(body.recipientName || '').trim(),
        postalCode: String(body.postalCode || '').trim(),
        street: String(body.street || '').trim(),
        number: String(body.number || '').trim(),
        complement: String(body.complement || '').trim() || null,
        neighborhood: String(body.neighborhood || '').trim(),
        city: String(body.city || '').trim(),
        state: String(body.state || '').trim().toUpperCase(),
        isDefault: body.isDefault === 'on' || body.isDefault === true,
    };
}

class AddressController {
    static async list(req, res, next) {
        try {
            const addresses = await Address.findAll({
                where: { userId: req.session.userId },
                order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
            });
            return res.renderComLayout('addresses/list', { titulo: 'Meus endereços', pagina: 'addresses', addresses });
        } catch (error) { return next(error); }
    }

    static showNew(req, res) {
        return res.renderComLayout('addresses/form', { titulo: 'Novo endereço', address: null, erro: null });
    }

    static async showEdit(req, res, next) {
        try {
            const address = await Address.findOne({ where: { id: req.params.id, userId: req.session.userId } });
            if (!address) {
                res.status(403);
                return res.renderComLayout('errors/403', { titulo: 'Acesso negado | Marketplace' });
            }
            return res.renderComLayout('addresses/form', { titulo: 'Editar endereço', address, erro: null });
        } catch (error) { return next(error); }
    }

    static async create(req, res, next) {
        const payload = addressPayload(req.body);
        try {
            await sequelize.transaction(async (transaction) => {
                const count = await Address.count({ where: { userId: req.session.userId }, transaction });
                if (payload.isDefault || count === 0) {
                    await Address.update({ isDefault: false }, { where: { userId: req.session.userId }, transaction });
                    payload.isDefault = true;
                }
                await Address.create({ ...payload, userId: req.session.userId }, { transaction });
            });
            return res.redirect('/addresses');
        } catch (error) { return next(error); }
    }

    static async update(req, res, next) {
        const payload = addressPayload(req.body);
        try {
            const address = await Address.findOne({ where: { id: req.params.id, userId: req.session.userId } });
            if (!address) return res.status(403).send('Acesso negado.');
            await sequelize.transaction(async (transaction) => {
                if (payload.isDefault) {
                    await Address.update({ isDefault: false }, { where: { userId: req.session.userId }, transaction });
                }
                await address.update(payload, { transaction });
            });
            return res.redirect('/addresses');
        } catch (error) { return next(error); }
    }

    static async destroy(req, res, next) {
        try {
            const address = await Address.findOne({ where: { id: req.params.id, userId: req.session.userId } });
            if (!address) return res.status(403).send('Acesso negado.');
            await address.destroy();
            if (address.isDefault) {
                const nextAddress = await Address.findOne({ where: { userId: req.session.userId }, order: [['createdAt', 'ASC']] });
                if (nextAddress) await nextAddress.update({ isDefault: true });
            }
            return res.redirect('/addresses');
        } catch (error) { return next(error); }
    }
}

module.exports = AddressController;
