document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".toggle-password").forEach(button => {

        button.addEventListener("click", () => {

            const input = button.parentElement.querySelector("input");

            if (!input) return;

            const icon = button.querySelector("i");

            const isPassword = input.type === "password";

            input.type = isPassword ? "text" : "password";

            icon.classList.toggle("fa-eye");
            icon.classList.toggle("fa-eye-slash");

            button.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );

        });

    });

});