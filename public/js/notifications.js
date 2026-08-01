(function ($) {
    'use strict';
    if (!$) return;
    $(document).on('click', '[data-read-notification]', function () {
        const $card = $(this).closest('[data-notification-id]');
        $.ajax({ url: `/notifications/${$card.data('notification-id')}/read`, method: 'PATCH' })
            .done(() => {
                $card.removeClass('border-primary');
                $card.find('[data-read-notification]').remove();
                const $count = $('#notification-count');
                $count.text(Math.max(0, Number($count.text()) - 1));
            });
    });
    $('[data-read-all]').on('click', function () {
        $.ajax({ url: '/notifications/read-all', method: 'PATCH' }).done(() => {
            $('[data-notification-id]').removeClass('border-primary');
            $('[data-read-notification]').remove();
            $('#notification-count').text('0');
            $(this).prop('disabled', true);
        });
    });
})(window.jQuery);
