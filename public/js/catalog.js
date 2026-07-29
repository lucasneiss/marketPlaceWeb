(function ($) {
    'use strict';

    if (!$) return;

    $(function () {
        const $filterForm = $('[data-catalog-filter-form]');

        if (!$filterForm.length) return;

        const $minPrice = $filterForm.find(
            'input[name="minPrice"]',
        );

        const $maxPrice = $filterForm.find(
            'input[name="maxPrice"]',
        );

        const $priceError = $filterForm.find(
            '[data-price-error]',
        );

        const $submitButton = $filterForm.find(
            '[data-filter-submit]',
        );

        const validatePrices = () => {
            const minPrice = Number.parseFloat($minPrice.val());
            const maxPrice = Number.parseFloat($maxPrice.val());

            const hasInvalidRange =
                Number.isFinite(minPrice)
                && Number.isFinite(maxPrice)
                && minPrice > maxPrice;

            $priceError.prop('hidden', !hasInvalidRange);

            $minPrice.toggleClass(
                'is-invalid',
                hasInvalidRange,
            );

            $maxPrice.toggleClass(
                'is-invalid',
                hasInvalidRange,
            );

            return !hasInvalidRange;
        };

        $minPrice
            .add($maxPrice)
            .on('input', validatePrices);

        $filterForm.on('submit', function (event) {
            if (!validatePrices()) {
                event.preventDefault();
                $maxPrice.trigger('focus');
                return;
            }

            $submitButton
                .prop('disabled', true)
                .html(
                    '<span class="spinner-border '
                    + 'spinner-border-sm me-2"></span>'
                    + 'Filtrando...',
                );
        });

        $('[data-catalog-sort]').on(
            'change',
            function () {
                if (validatePrices()) {
                    $filterForm.trigger('submit');
                }
            },
        );
    });
})(window.jQuery);