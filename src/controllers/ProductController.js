const { Op } = require('sequelize');
const { models } = require('../database');

const {
    Product,
    Category,
    SellerProfile,
} = models;

const PAGE_SIZE = 6;

const SORT_OPTIONS = {
    newest: [['createdAt', 'DESC']],
    'price-asc': [['price', 'ASC']],
    'price-desc': [['price', 'DESC']],
    'name-asc': [['name', 'ASC']],
    'name-desc': [['name', 'DESC']],
};

const IMAGE_CLASSES = {
    '/images/hero-categories.webp': 'hero-sprite',
    '/images/featured-products.webp': 'featured-sprite',
    '/images/best-sellers.webp': 'best-sellers-sprite',
};

const CONDITION_LABELS = {
    UNKNOWN: 'Não informado',
    GOOD: 'Novo',
    MEDIUM: 'Usado - bom estado',
    BAD: 'Usado - com marcas',
};

function stringParam(value, maxLength = 120) {
    return typeof value === 'string'
        ? value.trim().slice(0, maxLength)
        : '';
}

function positiveInteger(value, fallback = 1) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function priceParam(value) {
    const normalized = stringParam(value, 20).replace(',', '.');
    if (!normalized) return null;

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10000000
        ? parsed
        : null;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(value));
}

function toViewProduct(instance) {
    const product = instance.get({ plain: true });

    return {
        ...product,
        formattedPrice: formatCurrency(product.price),
        formattedOldPrice: product.oldPrice
            ? formatCurrency(product.oldPrice)
            : null,
        discountLabel: product.discountPercent
            ? `-${product.discountPercent}%`
            : null,
        availabilityLabel: product.quantity > 0
            ? `${product.quantity} unidade${product.quantity === 1 ? '' : 's'} em estoque`
            : 'Produto indisponível',
        isAvailable: product.quantity > 0,
        conditionLabel: CONDITION_LABELS[product.state] || CONDITION_LABELS.UNKNOWN,
        imageClass: IMAGE_CLASSES[product.imageUrl] || 'featured-sprite',
        positionClass: `sprite-${product.imagePosition}`,
    };
}

function buildCatalogUrl(filters, changes = {}) {
    const values = {
        ...filters,
        ...changes,
    };
    const params = new URLSearchParams();

    for (const key of [
        'q',
        'category',
        'seller',
        'minPrice',
        'maxPrice',
        'availability',
        'sort',
        'page',
    ]) {
        const value = values[key];
        if (value !== '' && value !== null && value !== undefined) {
            params.set(key, String(value));
        }
    }

    const query = params.toString();
    return query ? `/catalog?${query}` : '/catalog';
}

function catalogIncludes(categorySlug = '') {
    return [
        {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
            required: Boolean(categorySlug),
            where: categorySlug ? { slug: categorySlug } : undefined,
        },
        {
            model: SellerProfile,
            as: 'seller',
            attributes: ['id', 'storeName', 'slug', 'description'],
            required: true,
            where: { status: 'APPROVED' },
        },
    ];
}

function productIncludes() {
    return [
        {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug'],
        },
        {
            model: SellerProfile,
            as: 'seller',
            attributes: ['id', 'storeName', 'slug', 'description'],
            required: true,
            where: { status: 'APPROVED' },
        },
    ];
}

class ProductController {
    static async index(req, res, next) {
        try {
            // Recebe e valida os parâmetros GET
            const q = stringParam(req.query.q, 100);

            const category = stringParam(
                req.query.category,
                100,
            ).toLocaleLowerCase('pt-BR');

            const requestedSeller = positiveInteger(
                req.query.seller,
                0,
            );

            const seller = requestedSeller > 0
                ? requestedSeller
                : '';

            let minPrice = priceParam(
                req.query.minPrice,
            );

            let maxPrice = priceParam(
                req.query.maxPrice,
            );

            // Corrige intervalos invertidos
            if (
                minPrice !== null
                && maxPrice !== null
                && minPrice > maxPrice
            ) {
                [minPrice, maxPrice] = [
                    maxPrice,
                    minPrice,
                ];
            }

            const availabilityValue = stringParam(
                req.query.availability,
                20,
            );

            const availability = [
                'available',
                'unavailable',
            ].includes(availabilityValue)
                ? availabilityValue
                : '';

            const requestedSort = stringParam(
                req.query.sort,
                30,
            );

            // Aceita somente ordenações autorizadas
            const sort = Object.hasOwn(
                SORT_OPTIONS,
                requestedSort,
            )
                ? requestedSort
                : 'newest';

            const requestedPage = positiveInteger(
                req.query.page,
            );

            // Condições aplicadas à tabela products
            const where = {
                status: 'ACTIVE',
            };

            // Busca por nome ou descrição
            if (q) {
                where[Op.or] = [
                    {
                        name: {
                            [Op.like]: `%${q}%`,
                        },
                    },
                    {
                        description: {
                            [Op.like]: `%${q}%`,
                        },
                    },
                ];
            }

            // Filtro por vendedor
            if (seller) {
                where.sellerId = seller;
            }

            // Filtro por faixa de preço
            if (
                minPrice !== null
                || maxPrice !== null
            ) {
                where.price = {};

                if (minPrice !== null) {
                    where.price[Op.gte] = minPrice;
                }

                if (maxPrice !== null) {
                    where.price[Op.lte] = maxPrice;
                }
            }

            // Filtro por disponibilidade
            if (availability === 'available') {
                where.quantity = {
                    [Op.gt]: 0,
                };
            } else if (
                availability === 'unavailable'
            ) {
                where.quantity = 0;
            }

            const filters = {
                q,
                category,
                seller,
                minPrice:
                    minPrice === null ? '' : minPrice,
                maxPrice:
                    maxPrice === null ? '' : maxPrice,
                availability,
                sort,
            };

            // Busca dados auxiliares e total de resultados
            const [
                categories,
                sellers,
                count,
            ] = await Promise.all([
                Category.findAll({
                    attributes: [
                        'id',
                        'name',
                        'slug',
                    ],
                    order: [['name', 'ASC']],
                }),

                SellerProfile.findAll({
                    attributes: [
                        'id',
                        'storeName',
                        'slug',
                    ],
                    where: {
                        status: 'APPROVED',
                    },
                    order: [
                        ['storeName', 'ASC'],
                    ],
                }),

                Product.count({
                    where,
                    include: catalogIncludes(
                        category,
                    ),
                    distinct: true,
                }),
            ]);

            // Paginação
            const totalPages = Math.max(
                1,
                Math.ceil(count / PAGE_SIZE),
            );

            const currentPage = Math.min(
                requestedPage,
                totalPages,
            );

            const offset =
                (currentPage - 1) * PAGE_SIZE;

            // Busca somente os produtos da página atual
            const productRows = await Product.findAll({
                where,
                include: catalogIncludes(category),
                order: SORT_OPTIONS[sort],
                limit: PAGE_SIZE,
                offset,
            });

            // Botões numéricos da paginação
            const startPage = Math.max(
                1,
                currentPage - 2,
            );

            const endPage = Math.min(
                totalPages,
                currentPage + 2,
            );

            const pages = [];

            for (
                let page = startPage;
                page <= endPage;
                page += 1
            ) {
                pages.push({
                    number: page,
                    url: buildCatalogUrl(
                        filters,
                        { page },
                    ),
                    active: page === currentPage,
                });
            }

            // Filtros ativos exibidos na página
            const activeFilters = [];

            if (q) {
                activeFilters.push({
                    label: `Busca: “${q}”`,
                    url: buildCatalogUrl(filters, {
                        q: '',
                        page: 1,
                    }),
                });
            }

            const selectedCategory = categories.find(
                (item) => item.slug === category,
            );

            if (selectedCategory) {
                activeFilters.push({
                    label: selectedCategory.name,
                    url: buildCatalogUrl(filters, {
                        category: '',
                        page: 1,
                    }),
                });
            }

            const selectedSeller = sellers.find(
                (item) => item.id === seller,
            );

            if (selectedSeller) {
                activeFilters.push({
                    label: selectedSeller.storeName,
                    url: buildCatalogUrl(filters, {
                        seller: '',
                        page: 1,
                    }),
                });
            }

            if (
                minPrice !== null
                || maxPrice !== null
            ) {
                let rangeLabel;

                if (
                    minPrice !== null
                    && maxPrice !== null
                ) {
                    rangeLabel =
                        `${formatCurrency(minPrice)} a `
                        + formatCurrency(maxPrice);
                } else if (minPrice !== null) {
                    rangeLabel =
                        `A partir de ${
                            formatCurrency(minPrice)
                        }`;
                } else {
                    rangeLabel =
                        `Até ${
                            formatCurrency(maxPrice)
                        }`;
                }

                activeFilters.push({
                    label: rangeLabel,
                    url: buildCatalogUrl(filters, {
                        minPrice: '',
                        maxPrice: '',
                        page: 1,
                    }),
                });
            }

            if (availability) {
                activeFilters.push({
                    label:
                        availability === 'available'
                            ? 'Em estoque'
                            : 'Indisponíveis',

                    url: buildCatalogUrl(filters, {
                        availability: '',
                        page: 1,
                    }),
                });
            }

            return res.renderComLayout(
                'catalog/index',
                {
                    titulo:
                        'Catálogo de produtos | Marketplace',

                    pagina: 'catalog',
                    searchTerm: q,

                    products:
                        productRows.map(toViewProduct),

                    categories,
                    sellers,
                    filters,
                    activeFilters,
                    resultCount: count,

                    pagination: {
                        currentPage,
                        totalPages,
                        pages,

                        previousUrl:
                            currentPage > 1
                                ? buildCatalogUrl(
                                    filters,
                                    {
                                        page:
                                            currentPage - 1,
                                    },
                                )
                                : null,

                        nextUrl:
                            currentPage < totalPages
                                ? buildCatalogUrl(
                                    filters,
                                    {
                                        page:
                                            currentPage + 1,
                                    },
                                )
                                : null,

                        startItem:
                            count === 0
                                ? 0
                                : offset + 1,

                        endItem: Math.min(
                            offset + PAGE_SIZE,
                            count,
                        ),
                    },
                },
            );
        }
        catch (error) {
            return next(error);
        }
    }

    static async show(req, res, next) {
        try {
            const slug = stringParam(
                req.params.slug,
                120,
            ).toLocaleLowerCase('pt-BR');

            const productRow = await Product.findOne({
                where: {
                    slug,
                    status: 'ACTIVE',
                },
                include: productIncludes(),
            });

            if (!productRow) {
                res.status(404);

                return res.renderComLayout(
                    'errors/404',
                    {
                        titulo:
                            'Produto não encontrado | Marketplace',
                    },
                );
            }

            const relatedRows = await Product.findAll({
                where: {
                    categoryId: productRow.categoryId,

                    id: {
                        [Op.ne]: productRow.id,
                    },

                    status: 'ACTIVE',
                },

                include: productIncludes(),

                order: [
                    ['createdAt', 'DESC'],
                ],

                limit: 4,
            });

            const product = toViewProduct(productRow);

            const relatedProducts =
                relatedRows.map(toViewProduct);

            return res.renderComLayout(
                'catalog/details',
                {
                    titulo:
                        `${product.name} | Marketplace`,

                    pagina: 'product-details',
                    searchTerm: '',
                    product,
                    relatedProducts,
                },
            );
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = ProductController;