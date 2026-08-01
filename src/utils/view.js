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

const ORDER_STATUS_LABELS = {
    PENDING: 'Aguardando confirmação',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Em preparação',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelado',
};

const PAYMENT_LABELS = {
    PIX: 'PIX simulado',
    CREDIT_CARD: 'Cartão de crédito simulado',
    BANK_SLIP: 'Boleto simulado',
};

const DELIVERY_LABELS = {
    STANDARD: 'Entrega padrão',
    EXPRESS: 'Entrega expressa',
    PICKUP: 'Retirada com o vendedor',
};

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(value || 0));
}

function productToView(instance) {
    const product = typeof instance.get === 'function'
        ? instance.get({ plain: true })
        : instance;
    const isSprite = Boolean(IMAGE_CLASSES[product.imageUrl]);

    return {
        ...product,
        formattedPrice: formatCurrency(product.price),
        formattedOldPrice: product.oldPrice ? formatCurrency(product.oldPrice) : null,
        discountLabel: product.discountPercent ? `-${product.discountPercent}%` : null,
        availabilityLabel: product.quantity > 0
            ? `${product.quantity} unidade${product.quantity === 1 ? '' : 's'} em estoque`
            : 'Produto indisponível',
        isAvailable: product.quantity > 0 && product.status === 'ACTIVE',
        conditionLabel: CONDITION_LABELS[product.state] || CONDITION_LABELS.UNKNOWN,
        imageClass: IMAGE_CLASSES[product.imageUrl] || '',
        positionClass: isSprite ? `sprite-${product.imagePosition}` : '',
        isSprite,
    };
}

function orderToView(instance) {
    const order = typeof instance.get === 'function'
        ? instance.get({ plain: true })
        : instance;
    return {
        ...order,
        statusLabel: ORDER_STATUS_LABELS[order.status] || order.status,
        paymentLabel: PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod,
        deliveryLabel: DELIVERY_LABELS[order.deliveryMethod] || order.deliveryMethod,
        formattedTotal: formatCurrency(order.total),
        formattedShipping: formatCurrency(order.shippingPrice),
    };
}

module.exports = {
    formatCurrency,
    productToView,
    orderToView,
    ORDER_STATUS_LABELS,
    PAYMENT_LABELS,
    DELIVERY_LABELS,
};
