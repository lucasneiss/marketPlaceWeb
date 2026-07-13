const bcrypt = require('bcryptjs');

const ROLE_DATA = [
  {
    code: 'CLIENT',
    name: 'Cliente',
    description: 'Realiza compras, gerencia endereços, pedidos e avaliações.',
  },
  {
    code: 'SELLER',
    name: 'Vendedor',
    description: 'Gerencia perfil público, produtos, estoque e vendas próprias.',
  },
  {
    code: 'ADMIN',
    name: 'Administrador',
    description: 'Administra usuários, vendedores, categorias e moderação.',
  },
];

async function seedDatabase(models, transaction) {
  const { User, Role, Address, SellerProfile } = models;
  const roles = {};

  for (const roleData of ROLE_DATA) {
    const [role] = await Role.findOrCreate({
      where: { code: roleData.code },
      defaults: roleData,
      transaction,
    });
    roles[role.code] = role;
  }

  const demoPasswordHash = await bcrypt.hash(
    process.env.SEED_DEMO_PASSWORD || 'Marketplace@123',
    12,
  );

  const [admin] = await User.findOrCreate({
    where: { email: 'admin@marketplace.local' },
    defaults: {
      name: 'Administrador Demo',
      passwordHash: demoPasswordHash,
    },
    transaction,
  });
  await admin.addRole(roles.ADMIN, { through: { assignedAt: new Date() }, transaction });

  const [client] = await User.findOrCreate({
    where: { email: 'cliente@marketplace.local' },
    defaults: {
      name: 'Cliente Demo',
      passwordHash: demoPasswordHash,
    },
    transaction,
  });
  await client.addRole(roles.CLIENT, { through: { assignedAt: new Date() }, transaction });
  await Address.findOrCreate({
    where: { userId: client.id, label: 'Principal' },
    defaults: {
      recipientName: client.name,
      postalCode: '30130-010',
      street: 'Avenida Afonso Pena',
      number: '1000',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      isDefault: true,
    },
    transaction,
  });

  const [seller] = await User.findOrCreate({
    where: { email: 'vendedor@marketplace.local' },
    defaults: {
      name: 'Vendedor Demo',
      passwordHash: demoPasswordHash,
    },
    transaction,
  });
  await seller.addRole(roles.SELLER, { through: { assignedAt: new Date() }, transaction });
  await SellerProfile.findOrCreate({
    where: { userId: seller.id },
    defaults: {
      storeName: 'Loja de Demonstração',
      slug: 'loja-de-demonstracao',
      description: 'Perfil inicial para demonstração do marketplace.',
      status: 'APPROVED',
      approvedAt: new Date(),
    },
    transaction,
  });
}

module.exports = { seedDatabase, ROLE_DATA };
