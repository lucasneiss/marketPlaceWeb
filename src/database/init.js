const fs = require('node:fs/promises');
const path = require('node:path');
const {
    sequelize,
    models,
    connectDatabase,
} = require('./index');
const { seedDatabase } = require('./seed');

async function main() {
    const dataDirectory = path.resolve(
        __dirname,
        '../../data',
    );

    await fs.mkdir(dataDirectory, {
        recursive: true,
    });

    await connectDatabase();

    const shouldReset =
        process.argv.includes('--force')
        || process.env.DB_FORCE_RESET === 'true';

    await sequelize.sync({
        force: shouldReset,
    });

    await sequelize.transaction((transaction) =>
        seedDatabase(models, transaction),
    );

    console.log(
        'Banco inicializado e dados de demonstração criados.',
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());