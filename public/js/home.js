const $cards = $('[data-product-card]');
const $categoryButtons = $('[data-category-filter]');
const $searchForms = $('[data-home-search]');
const $searchInputs = $searchForms.find('input[name="q"]');
const $emptyState = $('[data-no-products]');

let selectedCategory = 'todos';

const normalizeText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();

const applyFilters = () => {
    const query = normalizeText($searchInputs.first().val());
    const normalizedCategory = normalizeText(selectedCategory);

    let visibleProducts = 0;

    $cards.each(function () {
        const $card = $(this);

        const cardSearch = normalizeText($card.data('search'));
        const cardCategory = normalizeText($card.data('category'));

        const matchesSearch =
            !query || cardSearch.includes(query);

        const matchesCategory =
            normalizedCategory === 'todos' ||
            cardCategory === normalizedCategory;

        const shouldShow =
            matchesSearch && matchesCategory;

        $card.toggleClass('d-none', !shouldShow);

        if (shouldShow) {
            visibleProducts += 1;
        }
    });

    $emptyState.prop('hidden', visibleProducts !== 0);
};

// Categorias
$categoryButtons.on('click', function () {
    selectedCategory = $(this).data('category-filter');

    $categoryButtons
        .removeClass('active')
        .attr('aria-pressed', 'false');

    $(this)
        .addClass('active')
        .attr('aria-pressed', 'true');

    applyFilters();
});

$('[data-favorite]').on('click', function () {
    const $button = $(this);
    const isFavorite =
        $button.attr('aria-pressed') === 'true';

    const $icon = $button.find('i');

    $button
        .attr('aria-pressed', String(!isFavorite))
        .toggleClass('is-favorite', !isFavorite);

    $icon
        .toggleClass('bi-heart', isFavorite)
        .toggleClass('bi-heart-fill', !isFavorite);
});