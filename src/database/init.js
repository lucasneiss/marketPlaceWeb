const fs = require('node:fs/promises');
const path = require('node:path');
const { sequelize, models, connectDatabase } = require('./index');
const { seedDatabase } = require('./seed');

async function main() {
  await fs.mkdir(path.resolve(__dirname, '../../data'), { recursive: true });
  await connectDatabase();

  // DB_FORCE_RESET=true é destinado somente ao desenvolvimento local.
  await sequelize.sync({ force: process.env.DB_FORCE_RESET === 'true' });
  await sequelize.transaction((transaction) => seedDatabase(models, transaction));

  console.log('Banco inicializado e dados de demonstração criados.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
