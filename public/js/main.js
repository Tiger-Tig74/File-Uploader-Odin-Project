(() => {
    "use strict";

    document.querySelectorAll("[data-autodismiss]").forEach((el) => {
        setTimeout(() => {
            el.style.transition = "opacity .4s ease";
            el.style.opacity = "0";
            setTimeout(() => el.remove(), 450);
        }, 4000);
    });

    document.querySelectorAll("form[data-confirm]").forEach((form) => {
        form.addEventListener("submit", (e) => {
            const msg = form.dataset.confirm || "Are you sure?";
            if (!window.confirm(msg)) e.preventDefault();
        });
    });

    const MAX_MB = Number(
        document.body.dataset.maxFileSizeMb ||
        document.querySelector('meta[name="max-file-size-mb"]')?.content ||
        10
    );

    document.querySelectorAll("[data-upload-form]").forEach((form) => {
        const input = form.querySelector('input[type="file"]');
        if (!input) return;

        input.addEventListener("change", () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > MAX_MB * 1024 * 1024) {
                alert(`File is too large. Max allowed is ${MAX_MB} MB.`);
                input.value = "";
            }
        });

        form.addEventListener("submit", () => {
            const btn = form.querySelector("button[type='submit']");
            if (btn) {
                btn.disabled = true;
                btn.textContent = "Uploading…";
            }
        });
    });

    document.querySelectorAll("[data-upload-form]").forEach((form) => {
        const input = form.querySelector('input[type="file"]');
        if (!input) return;

        const zone = form;
        ["dragenter", "dragover"].forEach((evt) =>
            zone.addEventListener(evt, (e) => {
                e.preventDefault();
                zone.classList.add("dragover");
            })
        );
        ["dragleave", "drop"].forEach((evt) =>
            zone.addEventListener(evt, (e) => {
                e.preventDefault();
                zone.classList.remove("dragover");
            })
        );
        zone.addEventListener("drop", (e) => {
            if (!e.dataTransfer?.files?.length) return;
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event("change"));
        });
    });
})();