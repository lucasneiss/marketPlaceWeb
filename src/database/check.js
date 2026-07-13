const { sequelize, models, connectDatabase } = require('./index');

async function main() {
  await connectDatabase();

  const users = await models.User.findAll({
    include: [
      { model: models.Role, as: 'roles', through: { attributes: ['assignedAt'] } },
      { model: models.Address, as: 'addresses' },
      { model: models.SellerProfile, as: 'sellerProfile' },
    ],
    order: [['id', 'ASC']],
  });

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
