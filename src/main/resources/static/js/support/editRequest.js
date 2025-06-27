document.addEventListener("click", async function (event) {
    const urlParts = window.location.pathname.split("/");
    const id = urlParts[urlParts.length - 1];

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

    if (event.target && event.target.id === "close-request") {
        try {
            const csrf = await getCsrfToken();
            $.ajax({
                url: "/requestClose",
                method: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(id),
                headers: { [csrf.headerName]: csrf.token },
                xhrFields: { withCredentials: true },
                success: function (data) {
                    console.log("Request close:", data);
                    showNotification(data.message, true);
                    window.refreshRequestData();
                    const closeButton = document.getElementById("close-request");
                    closeButton.style.display = "none";
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

    if (event.target && event.target.id === "reopen-request") {
        try {
            const csrf = await getCsrfToken();
            $.ajax({
                url: "/reopenRequest",
                method: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(id),
                headers: { [csrf.headerName]: csrf.token },
                xhrFields: { withCredentials: true },
                success: function (data) {
                    console.log("Request close:", data);
                    showNotification(data.message, true);
                    window.refreshRequestData();
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
    window.updateRequest = async function () {
        const tema = $('#tema').val();
        const priority = $('#priority').val();
        const description = $('#description').val();
        let rawUserId = $('#select-user').val();
        const userId = isNaN(rawUserId) ? null : Number(rawUserId);

        const requestData = {
            tema: tema,  // Устанавливаем пользователя как "USER"
            priority: priority,
            description: description,
            userId: userId,
            requestId: id
        };
        console.log(requestData)
        try {
            const csrf = await getCsrfToken();
            $.ajax({
                url: "/updateRequest",
                method: "POST",
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(requestData),
                headers: { [csrf.headerName]: csrf.token },
                xhrFields: { withCredentials: true },
                success: function (data) {
                    console.log("Request close:", data);
                    showNotification(data.message, true);
                    window.refreshRequestData();
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
});