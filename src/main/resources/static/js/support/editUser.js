document.addEventListener("DOMContentLoaded", () => {
    const editButton = document.getElementById("edit-request");
    const inputs = document.querySelectorAll("#firstName, #lastName, #email, #role, #country, #dateOfBirth, #gender");

    editButton.addEventListener("click", async () => {
        const isEditMode = !editButton.classList.contains("save-mode");

        if (isEditMode) {
            inputs.forEach(input => {
                input.removeAttribute("readonly");
                input.style.border = "1px solid #ccc";
            });
            editButton.textContent = "Сохранить";
            editButton.classList.add("save-mode");
        } else {
            inputs.forEach(input => input.setAttribute("readonly", "true"));
            editButton.textContent = "Редактировать";
            editButton.classList.remove("save-mode");
            await updateUser(); // Ждём завершения запроса
        }
    });

    async function updateUser() {
        const id = window.location.pathname.split("/").pop();

        const requestData = {
            firstName: $('#firstName').val(),
            lastName: $('#lastName').val(),
            email: $('#email').val(),
            role: $('#role').val(),
            country: $('#country').val(),
            dateOfBirth: $('#dateOfBirth').val(),
            gender: $('#gender').val(),
            userId: id
        };

        try {
            const csrf = await getCsrfToken();
            $.ajax({
                url: "/updateUser",
                method: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(requestData),
                headers: {[csrf.headerName]: csrf.token},
                xhrFields: {withCredentials: true},
                success: function (data) {
                    console.log("Request close:", data);
                    showNotification(data.message, true);
                    window.refreshRequestData?.(); // Если определена
                },
                error: function (error) {
                    console.error("Error:", error);
                    showNotification("Code " + error.status + " : " + error.responseJSON?.error, false);
                }
            });
        } catch (error) {
            console.error("Error:", error);
            showNotification("Ошибка", false);
        }
    }

    async function getCsrfToken() {
        return $.ajax({
            url: "/csrf-token",
            method: "GET",
            dataType: "json",
            xhrFields: { withCredentials: true }
        }).then(data => ({ headerName: data.headerName, token: data.token }))
            .catch(() => {
                console.error("Error fetching CSRF token");
                throw new Error("CSRF token error");
            });
    }
});
