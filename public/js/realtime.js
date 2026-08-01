(function ($) {
    'use strict';
    if (!$ || typeof io === 'undefined') return;
    const socket = io();

    function showToast(message, url) {
        const id = `live-${Date.now()}`;
        const safeMessage = $('<div>').text(message).html();
        const link = url ? `<a class="btn btn-sm btn-primary mt-2" href="${url}">Abrir</a>` : '';
        $('#live-toast-container').append(`<div id="${id}" class="toast" role="alert"><div class="toast-header"><i class="bi bi-bell me-2"></i><strong class="me-auto">Atualização em tempo real</strong><button class="btn-close" data-bs-dismiss="toast"></button></div><div class="toast-body">${safeMessage}${link}</div></div>`);
        const element = document.getElementById(id);
        const instance = bootstrap.Toast.getOrCreateInstance(element, { delay: 6000 });
        element.addEventListener('hidden.bs.toast', () => element.remove());
        instance.show();
    }

    socket.on('notification:new', (notification) => {
        const $count = $('#notification-count');
        $count.text(Number($count.text() || 0) + 1);
        showToast(notification.message, notification.url);
    });

    socket.on('order:status', (data) => {
        $(`[data-order-status][data-order-id="${data.orderId}"]`).text(data.statusLabel);
        showToast(`Pedido ${data.number}: ${data.statusLabel}`, `/orders/${data.orderId}`);
    });

    socket.on('stock:updated', (data) => {
        const $detail = $(`[data-product-detail][data-product-id="${data.productId}"]`);
        if ($detail.length) {
            const available = data.quantity > 0;
            $detail.find('[data-stock-label]')
                .toggleClass('is-available', available)
                .toggleClass('is-unavailable', !available)
                .html(`<i class="bi ${available ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i> ${available ? `${data.quantity} unidade(s) em estoque` : 'Produto indisponível'}`);
            $detail.find('[data-product-quantity]').attr('max', data.quantity);
            if (!available) $detail.find('[data-add-cart]').prop('disabled', true).text('Produto indisponível');
        }
        const $card = $(`[data-product-id="${data.productId}"]`);
        $card.find('[data-stock-badge]').text(data.quantity > 0 ? 'Em estoque' : 'Esgotado')
            .toggleClass('is-available', data.quantity > 0).toggleClass('is-unavailable', data.quantity <= 0);
    });

    socket.on('catalog:changed', () => {
        if ($('[data-catalog-product]').length) showToast('O catálogo foi atualizado. Recarregue a página para ver todas as mudanças.');
    });
})(window.jQuery);
