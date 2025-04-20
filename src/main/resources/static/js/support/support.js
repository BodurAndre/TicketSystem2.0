document.addEventListener("DOMContentLoaded", function () {
    const userRole = localStorage.getItem("role");

    if (userRole === "ROLE_PROCESSOR") {
        document.querySelectorAll(".processor-menu").forEach(el => el.remove());
    } else if (userRole === "ROLE_USER") {
        document.querySelectorAll(".user-menu").forEach(el => el.remove());
    } else if (userRole === "ROLE_ADMIN") {
        document.querySelectorAll(".admin-menu").forEach(el => el.remove());
    }

    // Ждём полной загрузки страницы (включая картинки, стили и т.д.)
    window.addEventListener("load", () => {
        const preloader = document.getElementById("preloader");
        preloader.classList.add("hidden");

        // Через 500мс убираем прелоадер из DOM
        setTimeout(() => {
            preloader.remove();
            document.body.classList.remove("loading");
        }, 500);
    });
});
