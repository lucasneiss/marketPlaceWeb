const { Op } = require('sequelize');
const homeData = require('../data/homeData');
const { sequelize, models } = require('../database');
const { productToView } = require('../utils/view');

const { User, Role, SellerProfile, Product, Category, Cart } = models;

const CATEGORY_ICONS = {
    eletronicos: 'bi-phone', roupas: 'bi-bag', calcados: 'bi-stars',
    acessorios: 'bi-watch', moveis: 'bi-lamp', livros: 'bi-book', beleza: 'bi-heart',
};

class AuthController {
    static async home(req, res, next) {
        try {
            const searchTerm = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
            const where = { status: 'ACTIVE' };
            if (searchTerm) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${searchTerm}%` } },
                    { description: { [Op.like]: `%${searchTerm}%` } },
                ];
            }

            const include = [
                { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
                {
                    model: SellerProfile,
                    as: 'seller',
                    attributes: ['id', 'storeName', 'slug', 'description'],
                    where: { status: 'APPROVED' },
                },
            ];

            const [categories, featuredRows, popularRows, productCount, sellerCount] = await Promise.all([
                Category.findAll({ order: [['name', 'ASC']] }),
                Product.findAll({ where, include, order: [['createdAt', 'DESC']], limit: 8 }),
                Product.findAll({ where, include, order: [['reviewCount', 'DESC'], ['rating', 'DESC']], limit: 8 }),
                Product.count({ where: { status: 'ACTIVE' } }),
                SellerProfile.count({ where: { status: 'APPROVED' } }),
            ]);

            return res.renderComLayout('home', {
                titulo: 'Marketplace | Compre e venda com confiança',
                pagina: 'home',
                searchTerm,
                heroCategories: homeData.heroCategories,
                categories: categories.map((category) => ({
                    ...category.get({ plain: true }),
                    icon: CATEGORY_ICONS[category.slug] || 'bi-grid',
                })),
                featuredProducts: featuredRows.map(productToView),
                bestSellers: popularRows.map(productToView),
                stats: { productCount, sellerCount },
            });
        } catch (error) {
            return next(error);
        }
    }

    static showLogin(req, res) {
        if (req.currentUser) return res.redirect('/lobby');
        return res.renderComLayout('login', { titulo: 'Entrar no Marketplace', erro: null });
    }

    static showRegister(req, res) {
        if (req.currentUser) return res.redirect('/lobby');
        return res.renderComLayout('register', { titulo: 'Criar uma Conta', erro: null, values: {} });
    }

    static async register(req, res, next) {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const roleCode = ['CLIENT', 'SELLER'].includes(req.body.role) ? req.body.role : null;
        const storeName = String(req.body.storeName || '').trim();
        const description = String(req.body.description || '').trim();

        if (!name || !email || password.length < 6 || !roleCode || (roleCode === 'SELLER' && !storeName)) {
            return res.status(400).renderComLayout('register', {
                titulo: 'Criar uma Conta',
                erro: 'Preencha corretamente todos os campos obrigatórios.',
                values: { name, email, role: roleCode, storeName, description },
            });
        }

        try {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).renderComLayout('register', {
                    titulo: 'Criar uma Conta',
                    erro: 'Este e-mail já está em uso.',
                    values: { name, email, role: roleCode, storeName, description },
                });
            }

            await sequelize.transaction(async (transaction) => {
                const role = await Role.findOne({ where: { code: roleCode }, transaction });
                if (!role) throw new Error('Perfis de usuário ainda não foram inicializados. Execute npm run db:reset.');

                const user = await User.create({ name, email, passwordHash: password }, { transaction });
                await user.addRole(role, { through: { assignedAt: new Date() }, transaction });
                await Cart.create({ userId: user.id }, { transaction });

                if (roleCode === 'SELLER') {
                    await SellerProfile.create({
                        userId: user.id,
                        storeName,
                        description,
                        status: 'PENDING',
                    }, { transaction });
                }
            });

            return res.redirect('/login?registered=1');
        } catch (error) {
            return next(error);
        }
    }

    static async login(req, res, next) {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        try {
            const user = await User.scope('withPassword').findOne({
                where: { email },
                include: [{ model: Role, as: 'roles', through: { attributes: [] } }],
            });

            if (!user || !(await user.checkPassword(password))) {
                return res.status(401).renderComLayout('login', {
                    titulo: 'Entrar no Marketplace',
                    erro: 'E-mail ou senha inválidos.',
                });
            }

            if (user.status === 'BLOCKED') {
                return res.status(403).renderComLayout('login', {
                    titulo: 'Entrar no Marketplace',
                    erro: 'Esta conta está bloqueada. Procure a administração.',
                });
            }

            user.lastLoginAt = new Date();
            await user.save({ hooks: false });
            req.session.userId = user.id;
            req.session.username = user.name;

            return req.session.save(() => res.redirect('/lobby'));
        } catch (error) {
            return next(error);
        }
    }

    static showLobby(req, res) {
        return res.renderComLayout('lobby', { titulo: 'Minha área' });
    }

    static logout(req, res) {
        req.session.destroy(() => res.redirect('/'));
    }

    static async showProfile(req, res, next) {
        try {
            const user = await User.findByPk(req.session.userId);
            return res.renderComLayout('profile', { titulo: 'Meu perfil', user, erro: null });
        } catch (error) {
            return next(error);
        }
    }

    static async updateProfile(req, res, next) {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        try {
            const user = await User.findByPk(req.session.userId);
            user.name = name;
            user.email = email;
            await user.save();
            req.session.username = user.name;
            return res.redirect('/profile?updated=1');
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                const user = await User.findByPk(req.session.userId);
                return res.status(409).renderComLayout('profile', {
                    titulo: 'Meu perfil', user, erro: 'Este e-mail já está em uso.',
                });
            }
            return next(error);
        }
    }

    static showChangePassword(req, res) {
        return res.renderComLayout('change-password', { titulo: 'Trocar senha', erro: null });
    }

    static async changePassword(req, res, next) {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        try {
            const user = await User.scope('withPassword').findByPk(req.session.userId);
            if (!(await user.checkPassword(String(currentPassword || '')))) {
                return res.status(400).renderComLayout('change-password', {
                    titulo: 'Trocar senha', erro: 'A senha atual está incorreta.',
                });
            }
            if (String(newPassword || '').length < 6) {
                return res.status(400).renderComLayout('change-password', {
                    titulo: 'Trocar senha', erro: 'A nova senha deve ter pelo menos 6 caracteres.',
                });
            }
            if (newPassword !== confirmPassword) {
                return res.status(400).renderComLayout('change-password', {
                    titulo: 'Trocar senha', erro: 'As novas senhas não coincidem.',
                });
            }
            user.passwordHash = newPassword;
            await user.save();
            return res.redirect('/profile?passwordChanged=1');
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = AuthController;
