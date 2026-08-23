(function ($) {
    'use strict';
    if (!$) return;

    $(document).on('click', '[data-save-stock]', function () {
        const $row = $(this).closest('[data-seller-product]');
        const $button = $(this);
        const quantity = Number($row.find('[data-stock-input]').val());
        $button.prop('disabled', true);
        $.ajax({
            url: `/seller/products/${$row.data('seller-product')}/stock`,
            method: 'PATCH', contentType: 'application/json', data: JSON.stringify({ quantity }),
        }).done((response) => {
            $row.find('[data-low-stock]').toggleClass('d-none', !response.lowStock);
            $button.text('Salvo');
            setTimeout(() => $button.text('Salvar'), 1200);
        }).fail((xhr) => alert(xhr.responseJSON?.message || 'Erro ao atualizar estoque.'))
            .always(() => $button.prop('disabled', false));
    });

    $('[data-order-status-form]').on('submit', function (event) {
        event.preventDefault();
        const $form = $(this);
        const data = Object.fromEntries(new FormData(this).entries());
        const $message = $form.find('[data-status-message]');
        $.ajax({
            url: `/seller/orders/${$form.data('order-id')}/status`, method: 'PATCH',
            contentType: 'application/json', data: JSON.stringify(data),
        }).done((response) => {
            $('[data-seller-order-status]').text(response.statusLabel);
            $message.removeClass('text-danger').addClass('text-success').text('Estado atualizado.');
            setTimeout(() => window.location.reload(), 700);
        }).fail((xhr) => $message.removeClass('text-success').addClass('text-danger').text(xhr.responseJSON?.message || 'Não foi possível atualizar.'));
    });

    function previewImage() {
        const url = $('[data-image-url]').val();
        const $preview = $('[data-image-preview]');
        if (!url || url.startsWith('/images/')) return $preview.addClass('d-none');
        $preview.attr('src', url).removeClass('d-none');
    }
    $('[data-image-url]').on('input', previewImage);
    previewImage();
})(window.jQuery);
