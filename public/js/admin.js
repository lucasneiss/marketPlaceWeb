(function ($) {
    'use strict';
    if (!$) return;
    $(document).on('click', '[data-review-action]', function () {
        const $card = $(this).closest('[data-admin-review]');
        const status = $(this).data('review-action');
        const $message = $card.find('[data-review-message]');
        $.ajax({
            url: `/admin/reviews/${$card.data('admin-review')}/status`, method: 'PATCH',
            contentType: 'application/json', data: JSON.stringify({ status }),
        }).done((response) => {
            $card.find('[data-review-status]').text(response.status);
            $message.removeClass('text-danger').addClass('text-success').text('Moderação salva.');
        }).fail((xhr) => $message.removeClass('text-success').addClass('text-danger').text(xhr.responseJSON?.message || 'Erro ao moderar.'));
    });
})(window.jQuery);
