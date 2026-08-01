const { fn, col } = require('sequelize');
const { models } = require('../database');

async function recalculateProductRating(productId, transaction = null) {
    const result = await models.Review.findOne({
        where: { productId, status: 'APPROVED' },
        attributes: [
            [fn('AVG', col('rating')), 'average'],
            [fn('COUNT', col('id')), 'count'],
        ],
        raw: true,
        transaction,
    });

    const rating = result?.average ? Number(result.average).toFixed(1) : 0;
    const reviewCount = Number(result?.count || 0);
    await models.Product.update({ rating, reviewCount }, { where: { id: productId }, transaction });
}

module.exports = { recalculateProductRating };
