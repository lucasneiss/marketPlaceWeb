const categories = [
    { name: 'Eletrônicos', slug: 'eletronicos', icon: 'bi-headphones' },
    { name: 'Roupas', slug: 'roupas', icon: 'bi-person-standing-dress' },
    { name: 'Calçados', slug: 'calcados', icon: 'bi-lightning-charge' },
    { name: 'Acessórios', slug: 'acessorios', icon: 'bi-bag' },
    { name: 'Móveis', slug: 'moveis', icon: 'bi-lamp' },
    { name: 'Livros', slug: 'livros', icon: 'bi-book' },
    { name: 'Beleza', slug: 'beleza', icon: 'bi-stars' },
];

const heroCategories = [
    {
        name: 'Eletrônicos',
        description: 'Tecnologia para todos os momentos',
        icon: 'bi-headphones',
        spriteClass: 'hero-sprite',
        positionClass: 'sprite-top-left',
    },
    {
        name: 'Roupas',
        description: 'Estilo para renovar o guarda-roupa',
        icon: 'bi-person-standing-dress',
        spriteClass: 'hero-sprite',
        positionClass: 'sprite-top-right',
    },
    {
        name: 'Calçados',
        description: 'Conforto para acompanhar seu ritmo',
        icon: 'bi-lightning-charge',
        spriteClass: 'hero-sprite',
        positionClass: 'sprite-bottom-left',
    },
    {
        name: 'Beleza',
        description: 'Cuidado e bem-estar todos os dias',
        icon: 'bi-stars',
        spriteClass: 'hero-sprite',
        positionClass: 'sprite-bottom-right',
    },
];

module.exports = {
    categories,
    heroCategories,
};
