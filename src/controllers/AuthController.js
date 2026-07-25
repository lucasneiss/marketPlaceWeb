const { sequelize, models } = require('../database');

const { User, Role, SellerProfile } = models;

class AuthController {
    static home(req, res) {
        if (req.session && req.session.userId) {
            return res.redirect('/lobby');
        }
        res.redirect('/login');
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
}

module.exports = AuthController;