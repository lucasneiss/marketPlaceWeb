const TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELED'],
    CONFIRMED: ['PREPARING', 'CANCELED'],
    PREPARING: ['SHIPPED', 'CANCELED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELED: [],
};

function canTransition(from, to) {
    return Boolean(TRANSITIONS[from]?.includes(to));
}

module.exports = { TRANSITIONS, canTransition };
