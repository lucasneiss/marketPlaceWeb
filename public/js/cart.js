(function ($) {
    'use strict';
    if (!$) return;

    function toast(message, type) {
        const id = `toast-${Date.now()}`;
        const html = `<div id="${id}" class="toast" role="alert"><div class="toast-header"><strong class="me-auto">Marketplace</strong><button type="button" class="btn-close" data-bs-dismiss="toast"></button></div><div class="toast-body ${type === 'error' ? 'text-danger' : ''}">${$('<div>').text(message).html()}</div></div>`;
        $('#live-toast-container').append(html);
        const element = document.getElementById(id);
        const instance = bootstrap.Toast.getOrCreateInstance(element, { delay: 3500 });
        element.addEventListener('hidden.bs.toast', () => element.remove());
        instance.show();
    }

    $(document).on('click', '[data-add-cart]', function () {
        const $button = $(this);
        const quantity = Number($button.closest('[data-product-detail]').find('[data-product-quantity]').val() || 1);
        $button.prop('disabled', true);
        $.ajax({
            url: '/cart/items', method: 'POST', contentType: 'application/json',
            data: JSON.stringify({ productId: $button.data('product-id'), quantity }),
        }).done((response) => {
            $('#cart-count').text(response.cartCount);
            toast(response.message || 'Produto adicionado.', 'success');
        }).fail((xhr) => {
            if (xhr.status === 401 || xhr.status === 403) window.location.href = '/login';
            else toast(xhr.responseJSON?.message || 'Não foi possível adicionar o produto.', 'error');
        }).always(() => $button.prop('disabled', false));
    });

    let updateTimer;
    $(document).on('input', '[data-cart-quantity]', function () {
        clearTimeout(updateTimer);
        const $input = $(this);
        updateTimer = setTimeout(() => {
            const $item = $input.closest('[data-cart-item]');
            $.ajax({
                url: `/cart/items/${$item.data('cart-item')}`,
                method: 'PATCH', contentType: 'application/json',
                data: JSON.stringify({ quantity: Number($input.val()) }),
            }).done((response) => {
                $item.find('[data-item-subtotal]').text(response.itemSubtotal);
                $('[data-cart-total]').text(response.total);
                $('#cart-count').text(response.cartCount);
                $('[data-checkout-button]').toggleClass('disabled', !response.canCheckout);
            }).fail((xhr) => toast(xhr.responseJSON?.message || 'Quantidade inválida.', 'error'));
        }, 350);
    });

    $(document).on('click', '[data-remove-cart]', function () {
        const $item = $(this).closest('[data-cart-item]');
        $.ajax({ url: `/cart/items/${$item.data('cart-item')}`, method: 'DELETE' })
            .done((response) => {
                $item.fadeOut(180, () => {
                    $item.remove();
                    $('[data-cart-total]').text(response.total);
                    $('#cart-count').text(response.cartCount);
                    if (response.empty) window.location.reload();
                });
            }).fail((xhr) => toast(xhr.responseJSON?.message || 'Não foi possível remover o item.', 'error'));
    });
})(window.jQuery);
