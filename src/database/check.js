const { sequelize, models, connectDatabase } = require('./index');

async function main() {
    await connectDatabase();

    const [
        users, sellers, categories, products, carts, orders, reviews, notifications,
    ] = await Promise.all([
        models.User.count(),
        models.SellerProfile.count(),
        models.Category.count(),
        models.Product.count(),
        models.Cart.count(),
        models.Order.count(),
        models.Review.count(),
        models.Notification.count(),
    ]);

    const demoUsers = await models.User.findAll({
        attributes: ['id', 'name', 'email', 'status'],
        include: [{
            model: models.Role,
            as: 'roles',
            attributes: ['code'],
            through: { attributes: [] },
        }],
        order: [['id', 'ASC']],
    });

    console.log('Banco conectado e associações consultadas com sucesso.');
    console.table({ users, sellers, categories, products, carts, orders, reviews, notifications });
    console.table(demoUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        roles: user.roles.map((role) => role.code).join(', '),
    })));
}

main()
    .catch((error) => {
        console.error('Falha ao verificar o banco:', error);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());
