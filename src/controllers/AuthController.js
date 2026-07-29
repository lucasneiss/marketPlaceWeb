const homeData = require('../data/homeData')

const { sequelize, models } = require('../database');

const { User, Role, SellerProfile } = models;

class AuthController {
    static home(req, res) {
        const searchTerm =
            typeof req.query.q === 'string'
                ? req.query.q.trim()
                : '';

        const normalizeText = (value) => String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR');

        const normalizedSearch = normalizeText(searchTerm);

        const filterProducts = (products) => {
            if (!normalizedSearch) return products;

            return products.filter((product) => {
                const searchableText = [
                    product.name,
                    product.category,
                    product.searchTerms
                ].join(' ');

                return normalizeText(searchableText)
                    .includes(normalizedSearch);
            });
        };

        res.renderComLayout('home', {
            titulo: 'Marketplace | Compre e venda com confiança',
            pagina: 'home',
            searchTerm,
            categories: homeData.categories,
            heroCategories: homeData.heroCategories,
            featuredProducts: filterProducts(
                homeData.featuredProducts
            ),
            bestSellers: filterProducts(
                homeData.bestSellers
            )
        });
    }

    static showLogin(req, res) {
        res.renderComLayout('login', { titulo: 'Entrar no Marketplace' });
    }

    static showRegister(req, res) {
        res.renderComLayout('register', { titulo: 'Criar uma Conta' });
    }

    // (POST /register)
    static async register(req, res, next) {
        const { name, email, password, role, storeName, description } = req.body;

        const transaction = await sequelize.transaction();

        try {
            const existingUser = await User.findOne({ where: { email }, transaction });
            if (existingUser) {
                await transaction.rollback();
                return res.send(`
                    <script>
                        alert("Este e-mail já está em uso! Por favor, utilize outro.");
                        window.location.href = "/register"; 
                    </script>
                `);
            }

            const user = await User.create({
                name,
                email,
                passwordHash: password
            }, { transaction });

            const assignedRole = await Role.findOne({ where: { code: role }, transaction });
            if (!assignedRole) {
                throw new Error('Cargo solicitado inválido no sistema.');
            }

            await user.addRole(assignedRole, {
                through: { assignedAt: new Date() },
                transaction
            });

            if (role === 'SELLER') {
                await SellerProfile.create({
                    userId: user.id,
                    storeName,
                    description,
                    status: 'PENDING'
                }, { transaction });
            }

            await transaction.commit();

            res.redirect('/login');

        } catch (error) {
            await transaction.rollback();
            console.error('Erro no registro de usuário:', error);
            next(error);
        }
    }
    static async login(req, res, next) {
        const { email, password } = req.body;

        try {
            const user = await User.scope('withPassword').findOne({ where: { email } });

            if (!user) {
                return res.send(`<script>alert("E-mail ou senha inválidos."); window.location.href="/login";</script>`);
            }

            const senhaCorreta = await user.checkPassword(password);
            if (!senhaCorreta) {
                return res.send(`<script>alert("E-mail ou senha inválidos."); window.location.href="/login";</script>`);
            }

            req.session.userId = user.id;
            req.session.username = user.name;

            res.redirect('/lobby');
        } catch (error) {
            next(error);
        }
    }

    static showLobby(req, res) {
        res.renderComLayout('lobby', { titulo: 'Início' });
    }

    static logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    }

    static async showProfile(req, res, next) {
        try {
            const user = await User.findByPk(req.session.userId);
            res.renderComLayout('profile', { titulo: 'Meu perfil', user });
        } catch (error) {
            next(error);
        }
    }

    static async updateProfile(req, res, next) {
        const { name, email } = req.body;

        try {
            const user = await User.findByPk(req.session.userId);

            user.name = name;
            user.email = email;
            await user.save();

            req.session.username = user.name;

            res.redirect('/profile');
        } catch (error) {
            next(error);
        }
    }
    static showChangePassword(req, res) {
        res.renderComLayout('change-password', { titulo: 'Trocar senha' });
    }

    static async changePassword(req, res, next) {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        try {
            const user = await User.scope('withPassword').findByPk(req.session.userId);

            const senhaAtualCorreta = await user.checkPassword(currentPassword);
            if (!senhaAtualCorreta) {
                return res.send(`<script>alert("Senha atual incorreta."); window.location.href="/change-password";</script>`);
            }

            if (newPassword !== confirmPassword) {
                return res.send(`<script>alert("As senhas não coincidem."); window.location.href="/change-password";</script>`);
            }

            user.passwordHash = newPassword;
            await user.save();

            res.redirect('/profile');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;