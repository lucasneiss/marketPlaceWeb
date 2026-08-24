(() => {
    'use strict';

    const modalElement =
        document.getElementById('actionConfirmModal');

    if (!modalElement || typeof bootstrap === 'undefined') {
        return;
    }

    const modal =
        bootstrap.Modal.getOrCreateInstance(modalElement);

    const titleElement =
        document.getElementById('actionConfirmModalTitle');

    const descriptionElement =
        document.getElementById(
            'actionConfirmModalDescription'
        );

    const confirmButton =
        modalElement.querySelector(
            '[data-confirm-proceed]'
        );

    const cancelButton =
        modalElement.querySelector(
            '[data-confirm-cancel]'
        );

    const bypassForms = new WeakSet();

    let pendingForm = null;
    let pendingSubmitter = null;
    let previousFocus = null;

    const allowedVariants = new Set([
        'btn-danger',
        'btn-warning',
        'btn-primary',
        'btn-brand'
    ]);

    document.addEventListener(
        'submit',
        function (event) {
            const form = event.target;

            if (!(form instanceof HTMLFormElement)) {
                return;
            }

            /*
             * Quando o usuário já confirmou,
             * permitimos o segundo submit.
             */
            if (bypassForms.has(form)) {
                bypassForms.delete(form);
                return;
            }

            const submitter = event.submitter;

            let confirmationSource = null;

            /*
             * Permite confirmação em um botão específico.
             *
             * Isso é necessário, por exemplo, em um
             * formulário que possui "Salvar" e "Excluir".
             */
            if (
                submitter &&
                submitter.matches('[data-confirm]')
            ) {
                confirmationSource = submitter;
            }

            /*
             * Ou confirmação para o formulário inteiro.
             */
            if (
                !confirmationSource &&
                form.matches('[data-confirm]')
            ) {
                confirmationSource = form;
            }

            if (!confirmationSource) {
                return;
            }

            event.preventDefault();

            /*
             * Impede outros scripts de executar a ação
             * antes de o usuário confirmar.
             */
            event.stopImmediatePropagation();

            pendingForm = form;
            pendingSubmitter = submitter;
            previousFocus = document.activeElement;

            const title =
                confirmationSource.dataset.confirmTitle
                || 'Confirmar ação';

            const message =
                confirmationSource.dataset.confirmMessage
                || 'Deseja realmente continuar?';

            const label =
                confirmationSource.dataset.confirmLabel
                || 'Confirmar';

            const variant =
                confirmationSource.dataset.confirmVariant;

            titleElement.textContent = title;
            descriptionElement.textContent = message;
            confirmButton.textContent = label;

            confirmButton.className = 'btn';

            confirmButton.classList.add(
                allowedVariants.has(variant)
                    ? variant
                    : 'btn-danger'
            );

            confirmButton.disabled = false;

            modal.show();
        },
        true
    );

    confirmButton.addEventListener(
        'click',
        function () {
            if (!pendingForm) {
                return;
            }

            const form = pendingForm;
            const submitter = pendingSubmitter;

            /*
             * Evita dois cliques seguidos em uma
             * operação crítica.
             */
            confirmButton.disabled = true;

            pendingForm = null;
            pendingSubmitter = null;

            bypassForms.add(form);

            modal.hide();

            /*
             * requestSubmit() mantém:
             *
             * - validação HTML;
             * - botão utilizado;
             * - formaction;
             * - name/value do botão.
             */
            if (submitter) {
                form.requestSubmit(submitter);
            } else {
                form.requestSubmit();
            }
        }
    );

    modalElement.addEventListener(
        'shown.bs.modal',
        function () {
            /*
             * O foco começa no botão seguro:
             * Cancelar.
             */
            cancelButton.focus();
        }
    );

    modalElement.addEventListener(
        'hidden.bs.modal',
        function () {
            pendingForm = null;
            pendingSubmitter = null;

            confirmButton.disabled = false;

            if (
                previousFocus &&
                typeof previousFocus.focus === 'function'
            ) {
                previousFocus.focus();
            }

            previousFocus = null;
        }
    );
})();