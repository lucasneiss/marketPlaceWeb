const { Op } = require('sequelize');
const { models } = require('../database');
const { productToView } = require('../utils/view');

const { Product, Category, SellerProfile, ProductImage, Review, User } = models;
const PAGE_SIZE = 8;
const SORT_OPTIONS = {
    newest: [['createdAt', 'DESC']],
    oldest: [['createdAt', 'ASC']],
    'price-asc': [['price', 'ASC']],
    'price-desc': [['price', 'DESC']],
    'name-asc': [['name', 'ASC']],
    'name-desc': [['name', 'DESC']],
};

function text(value, max = 120) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function positiveInt(value, fallback = 1) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function price(value) {
    const parsed = Number.parseFloat(text(value, 20).replace(',', '.'));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function buildUrl(filters, changes = {}) {
    const params = new URLSearchParams();
    const values = { ...filters, ...changes };
    Object.entries(values).forEach(([key, value]) => {
        const hasValue = value !== '' && value !== null && value !== undefined;
        const shouldInclude = key === 'page' ? Number(value) > 1 : hasValue;
        if (hasValue && shouldInclude) params.set(key, String(value));
    });
    return params.size ? `/catalog?${params}` : '/catalog';
}
function productIncludes(categorySlug = '') {
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

class ProductController {
    static async index(req, res, next) {
        try {
            const q = text(req.query.q, 100);
            const category = text(req.query.category, 100).toLowerCase();
            const seller = positiveInt(req.query.seller, 0) || '';
            let minPrice = price(req.query.minPrice);
            let maxPrice = price(req.query.maxPrice);
            if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
            const availability = ['available', 'unavailable'].includes(req.query.availability)
                ? req.query.availability : '';
            const sort = Object.hasOwn(SORT_OPTIONS, req.query.sort) ? req.query.sort : 'newest';
            const requestedPage = positiveInt(req.query.page, 1);

            const where = { status: 'ACTIVE' };
            if (q) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } },
                ];
            }
            if (seller) where.sellerId = seller;
            if (minPrice !== null || maxPrice !== null) {
                where.price = {};
                if (minPrice !== null) where.price[Op.gte] = minPrice;
                if (maxPrice !== null) where.price[Op.lte] = maxPrice;
            }
            if (availability === 'available') where.quantity = { [Op.gt]: 0 };
            if (availability === 'unavailable') where.quantity = 0;

            const filters = {
                q, category, seller,
                minPrice: minPrice ?? '', maxPrice: maxPrice ?? '',
                availability, sort,
            };

            const [categories, sellers, count] = await Promise.all([
                Category.findAll({ order: [['name', 'ASC']] }),
                SellerProfile.findAll({ where: { status: 'APPROVED' }, order: [['storeName', 'ASC']] }),
                Product.count({ where, include: productIncludes(category), distinct: true }),
            ]);
            const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
            const currentPage = Math.min(requestedPage, totalPages);
            const offset = (currentPage - 1) * PAGE_SIZE;
            const productRows = await Product.findAll({
                where,
                include: productIncludes(category),
                order: SORT_OPTIONS[sort],
                limit: PAGE_SIZE,
                offset,
            });

            const pages = [];
            for (let pageNumber = Math.max(1, currentPage - 2); pageNumber <= Math.min(totalPages, currentPage + 2); pageNumber += 1) {
                pages.push({ number: pageNumber, url: buildUrl(filters, { page: pageNumber }), active: pageNumber === currentPage });
            }

            const activeFilters = [];
            if (q) activeFilters.push({ label: `Busca: “${q}”`, url: buildUrl(filters, { q: '', page: 1 }) });
            const selectedCategory = categories.find((item) => item.slug === category);
            if (selectedCategory) activeFilters.push({ label: selectedCategory.name, url: buildUrl(filters, { category: '', page: 1 }) });
            const selectedSeller = sellers.find((item) => item.id === Number(seller));
            if (selectedSeller) activeFilters.push({ label: selectedSeller.storeName, url: buildUrl(filters, { seller: '', page: 1 }) });
            if (minPrice !== null || maxPrice !== null) activeFilters.push({ label: 'Faixa de preço', url: buildUrl(filters, { minPrice: '', maxPrice: '', page: 1 }) });
            if (availability) activeFilters.push({ label: availability === 'available' ? 'Em estoque' : 'Esgotados', url: buildUrl(filters, { availability: '', page: 1 }) });

            return res.renderComLayout('catalog/index', {
                titulo: 'Catálogo de produtos | Marketplace', pagina: 'catalog', searchTerm: q,
                products: productRows.map(productToView), categories, sellers, filters, activeFilters,
                resultCount: count,
                pagination: {
                    currentPage, totalPages, pages,
                    previousUrl: currentPage > 1 ? buildUrl(filters, { page: currentPage - 1 }) : null,
                    nextUrl: currentPage < totalPages ? buildUrl(filters, { page: currentPage + 1 }) : null,
                    startItem: count ? offset + 1 : 0,
                    endItem: Math.min(offset + PAGE_SIZE, count),
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    static async show(req, res, next) {
        try {
            const productRow = await Product.findOne({
                where: { slug: text(req.params.slug, 120).toLowerCase(), status: 'ACTIVE' },
                include: [
                    ...productIncludes(),
                    { model: ProductImage, as: 'images', separate: true, order: [['position', 'ASC']] },
                    {
                        model: Review,
                        as: 'reviews',
                        where: { status: 'APPROVED' },
                        required: false,
                        include: [{ model: User, as: 'client', attributes: ['id', 'name'] }],
                    },
                ],
            });
            if (!productRow) {
                res.status(404);
                return res.renderComLayout('errors/404', { titulo: 'Produto não encontrado | Marketplace' });
            }

            const relatedRows = await Product.findAll({
                where: { categoryId: productRow.categoryId, id: { [Op.ne]: productRow.id }, status: 'ACTIVE' },
                include: productIncludes(), order: [['createdAt', 'DESC']], limit: 4,
            });
            return res.renderComLayout('catalog/details', {
                titulo: `${productRow.name} | Marketplace`, pagina: 'product-details', searchTerm: '',
                product: productToView(productRow),
                relatedProducts: relatedRows.map(productToView),
            });
        } catch (error) {
            return next(error);
        }
    }

    static async sellerPublic(req, res, next) {
        try {
            const seller = await SellerProfile.findOne({
                where: { slug: text(req.params.slug, 120).toLowerCase(), status: 'APPROVED' },
                include: [{ model: User, as: 'user', attributes: ['name'] }],
            });
            if (!seller) {
                res.status(404);
                return res.renderComLayout('errors/404', { titulo: 'Vendedor não encontrado | Marketplace' });
            }
            const products = await Product.findAll({
                where: { sellerId: seller.id, status: 'ACTIVE' },
                include: [{ model: Category, as: 'category' }, { model: SellerProfile, as: 'seller' }],
                order: [['createdAt', 'DESC']],
            });
            return res.renderComLayout('sellers/public', {
                titulo: `${seller.storeName} | Marketplace`, pagina: 'seller-public', seller,
                products: products.map(productToView),
            });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = ProductController;
