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

const CATEGORY_DATA = [
    {
        name: 'Eletrônicos',
        slug: 'eletronicos',
        description: 'Tecnologia, áudio e dispositivos inteligentes.',
    },
    {
        name: 'Roupas',
        slug: 'roupas',
        description: 'Peças casuais e sociais para diferentes estilos.',
    },
    {
        name: 'Calçados',
        slug: 'calcados',
        description: 'Conforto e desempenho para todos os momentos.',
    },
    {
        name: 'Acessórios',
        slug: 'acessorios',
        description: 'Itens para completar sua rotina.',
    },
    {
        name: 'Móveis',
        slug: 'moveis',
        description: 'Móveis funcionais para casa e escritório.',
    },
    {
        name: 'Livros',
        slug: 'livros',
        description: 'Conhecimento, estudo e entretenimento.',
    },
    {
        name: 'Beleza',
        slug: 'beleza',
        description: 'Produtos de cuidado pessoal e bem-estar.',
    },
];

const SELLER_DATA = [
    {
        key: 'horizonte',
        email: 'vendedor@marketplace.local',
        name: 'Marina da Silva',
        storeName: 'Loja Horizonte',
        slug: 'loja-horizonte',
        description: 'Tecnologia e produtos selecionados para uma rotina mais prática.',
    },
    {
        key: 'urbano',
        email: 'estilo@marketplace.local',
        name: 'Carlos Andrade',
        storeName: 'Estilo Urbano',
        slug: 'estilo-urbano',
        description: 'Moda, calçados e acessórios com design contemporâneo.',
    },
    {
        key: 'aurora',
        email: 'aurora@marketplace.local',
        name: 'Fernanda Rocha',
        storeName: 'Casa Aurora',
        slug: 'casa-aurora',
        description: 'Curadoria de itens para casa, beleza e bem-estar.',
    },
];

const PRODUCT_DATA = [
    {
        seller: 'urbano',
        category: 'calcados',
        name: 'Tênis Pulse Run Pro',
        slug: 'tenis-pulse-run-pro',
        description: 'Tênis leve para corrida e uso diário, com cabedal respirável e sola de alta aderência.',
        price: 349.90,
        oldPrice: 499.90,
        discountPercent: 30,
        quantity: 18,
        imageUrl: '/images/featured-products.webp',
        imagePosition: 'top-left',
        rating: 4.9,
        reviewCount: 234,
        createdAt: new Date('2026-07-03T12:00:00Z'),
    },
    {
        seller: 'urbano',
        category: 'acessorios',
        name: 'Mochila Urban Explorer 40L',
        slug: 'mochila-urban-explorer-40l',
        description: 'Mochila resistente com compartimento para notebook, bolsos organizadores e capacidade de 40 litros.',
        price: 189.90,
        oldPrice: 259.90,
        discountPercent: 27,
        quantity: 0,
        imageUrl: '/images/featured-products.webp',
        imagePosition: 'top-right',
        rating: 4.8,
        reviewCount: 187,
        createdAt: new Date('2026-07-05T12:00:00Z'),
    },
    {
        seller: 'horizonte',
        category: 'eletronicos',
        name: 'Smartwatch Horizon X',
        slug: 'smartwatch-horizon-x',
        description: 'Relógio inteligente com monitoramento de atividades, notificações e bateria de longa duração.',
        price: 899.00,
        oldPrice: 1199.00,
        discountPercent: 25,
        quantity: 12,
        imageUrl: '/images/featured-products.webp',
        imagePosition: 'bottom-left',
        rating: 4.9,
        reviewCount: 512,
        createdAt: new Date('2026-07-12T12:00:00Z'),
    },
    {
        seller: 'horizonte',
        category: 'eletronicos',
        name: 'Fone Bluetooth Wave Pro',
        slug: 'fone-bluetooth-wave-pro',
        description: 'Fone sem fio com isolamento acústico, graves equilibrados e até 30 horas de autonomia.',
        price: 279.90,
        oldPrice: null,
        discountPercent: null,
        quantity: 23,
        imageUrl: '/images/featured-products.webp',
        imagePosition: 'bottom-right',
        rating: 4.7,
        reviewCount: 98,
        createdAt: new Date('2026-07-10T12:00:00Z'),
    },
    {
        seller: 'aurora',
        category: 'moveis',
        name: 'Cadeira Ergonômica Pro',
        slug: 'cadeira-ergonomica-pro',
        description: 'Cadeira para escritório com ajuste de altura, apoio lombar e estrutura reforçada.',
        price: 1249.00,
        oldPrice: 1599.00,
        discountPercent: 22,
        quantity: 5,
        imageUrl: '/images/best-sellers.webp',
        imagePosition: 'top-left',
        rating: 4.8,
        reviewCount: 76,
        createdAt: new Date('2026-07-02T12:00:00Z'),
    },
    {
        seller: 'urbano',
        category: 'roupas',
        name: 'Camisa Linho Premium',
        slug: 'camisa-linho-premium',
        description: 'Camisa de corte clássico produzida em tecido leve, confortável e adequada para dias quentes.',
        price: 129.90,
        oldPrice: 179.90,
        discountPercent: 28,
        quantity: 30,
        imageUrl: '/images/best-sellers.webp',
        imagePosition: 'top-right',
        rating: 4.7,
        reviewCount: 143,
        createdAt: new Date('2026-07-08T12:00:00Z'),
    },
    {
        seller: 'horizonte',
        category: 'livros',
        name: 'Livro: Design de Sistemas',
        slug: 'livro-design-de-sistemas',
        description: 'Introdução prática aos fundamentos de arquitetura, escalabilidade e construção de sistemas web.',
        price: 89.90,
        oldPrice: null,
        discountPercent: null,
        quantity: 42,
        imageUrl: '/images/best-sellers.webp',
        imagePosition: 'bottom-left',
        rating: 4.9,
        reviewCount: 321,
        createdAt: new Date('2026-07-01T12:00:00Z'),
    },
    {
        seller: 'aurora',
        category: 'beleza',
        name: 'Kit Skincare Natural',
        slug: 'kit-skincare-natural',
        description: 'Kit de cuidados faciais com produtos suaves para limpeza, hidratação e proteção da pele.',
        price: 219.90,
        oldPrice: 299.90,
        discountPercent: 27,
        quantity: 0,
        imageUrl: '/images/best-sellers.webp',
        imagePosition: 'bottom-right',
        rating: 4.8,
        reviewCount: 267,
        createdAt: new Date('2026-07-06T12:00:00Z'),
    },
    {
        seller: 'horizonte',
        category: 'eletronicos',
        name: 'Kit Áudio Mobile',
        slug: 'kit-audio-mobile',
        description: 'Conjunto compacto com fone, suporte e acessórios essenciais para música e chamadas.',
        price: 459.90,
        oldPrice: 529.90,
        discountPercent: 13,
        quantity: 9,
        imageUrl: '/images/hero-categories.webp',
        imagePosition: 'top-left',
        rating: 4.6,
        reviewCount: 64,
        createdAt: new Date('2026-07-09T12:00:00Z'),
    },
    {
        seller: 'urbano',
        category: 'roupas',
        name: 'Casaco Essencial',
        slug: 'casaco-essencial',
        description: 'Casaco versátil de modelagem confortável para compor produções casuais em dias amenos.',
        price: 239.90,
        oldPrice: null,
        discountPercent: null,
        quantity: 16,
        imageUrl: '/images/hero-categories.webp',
        imagePosition: 'top-right',
        rating: 4.5,
        reviewCount: 51,
        createdAt: new Date('2026-07-04T12:00:00Z'),
    },
    {
        seller: 'urbano',
        category: 'calcados',
        name: 'Tênis Urban Flex',
        slug: 'tenis-urban-flex',
        description: 'Tênis casual com amortecimento macio, acabamento moderno e solado flexível.',
        price: 299.90,
        oldPrice: 379.90,
        discountPercent: 21,
        quantity: 14,
        imageUrl: '/images/hero-categories.webp',
        imagePosition: 'bottom-left',
        rating: 4.7,
        reviewCount: 119,
        createdAt: new Date('2026-07-11T12:00:00Z'),
    },
    {
        seller: 'aurora',
        category: 'beleza',
        name: 'Sérum Facial Balance',
        slug: 'serum-facial-balance',
        description: 'Sérum hidratante de textura leve, indicado para complementar a rotina diária de cuidados.',
        price: 149.90,
        oldPrice: 189.90,
        discountPercent: 21,
        quantity: 27,
        imageUrl: '/images/hero-categories.webp',
        imagePosition: 'bottom-right',
        rating: 4.6,
        reviewCount: 88,
        createdAt: new Date('2026-07-07T12:00:00Z'),
    },
];

async function createUserWithRole(models, userData, role, password, transaction) {
    const { User } = models;
    const [user] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: {
            name: userData.name,
            passwordHash: password,
        },
        transaction,
    });

    await user.addRole(role, {
        through: { assignedAt: new Date() },
        transaction,
    });

    return user;
}

async function seedDatabase(models, transaction) {
    const {
        User,
        Role,
        Address,
        SellerProfile,
        Category,
        Product,
    } = models;
    const roles = {};
    const categories = {};
    const sellers = {};

    for (const roleData of ROLE_DATA) {
        const [role] = await Role.findOrCreate({
            where: { code: roleData.code },
            defaults: roleData,
            transaction,
        });
        roles[role.code] = role;
    }

    for (const categoryData of CATEGORY_DATA) {
        const [category] = await Category.findOrCreate({
            where: { slug: categoryData.slug },
            defaults: categoryData,
            transaction,
        });
        categories[category.slug] = category;
    }

    const demoPlainPassword = process.env.SEED_DEMO_PASSWORD || 'Marketplace@123';

    await createUserWithRole(
        models,
        {
            email: 'admin@marketplace.local',
            name: 'Administrador Demo',
        },
        roles.ADMIN,
        demoPlainPassword,
        transaction,
    );

    const client = await createUserWithRole(
        models,
        {
            email: 'cliente@marketplace.local',
            name: 'Cliente Demo',
        },
        roles.CLIENT,
        demoPlainPassword,
        transaction,
    );

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

    for (const sellerData of SELLER_DATA) {
        const user = await createUserWithRole(
            models,
            sellerData,
            roles.SELLER,
            demoPlainPassword,
            transaction,
        );

        const [sellerProfile] = await SellerProfile.findOrCreate({
            where: { userId: user.id },
            defaults: {
                storeName: sellerData.storeName,
                slug: sellerData.slug,
                description: sellerData.description,
                status: 'APPROVED',
                approvedAt: new Date(),
            },
            transaction,
        });

        sellers[sellerData.key] = sellerProfile;
    }

    for (const productData of PRODUCT_DATA) {
        const { seller, category, ...defaults } = productData;

        await Product.findOrCreate({
            where: { slug: productData.slug },
            defaults: {
                ...defaults,
                sellerId: sellers[seller].id,
                categoryId: categories[category].id,
                state: 'GOOD',
                status: 'ACTIVE',
            },
            transaction,
        });
    }
}

module.exports = {
    seedDatabase,
    ROLE_DATA,
    CATEGORY_DATA,
    SELLER_DATA,
    PRODUCT_DATA,
};