let requestId;

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

export function init(id) {
    if (!id) {
        console.error("Нет ID заявки!");
        return;
    }
    requestId = id;
    loadTicketData(id);
}

async function loadTicketData(id) {
    try {
        const userRole = localStorage.getItem("role");
        const response = await fetch(`/getRequest/${id}`);
        if (response.status === 403) {
            const errorMessage = await response.text(); // читаем текст с сервера
            showNotification(errorMessage, 'error'); // выводим уведомление
            return; // и не ломаем страницу
        }
        if (!response.ok) throw new Error("Ошибка при загрузке данных");

        const data = await response.json();

        console.log(data);
        document.getElementById("data").value = data.data;
        document.getElementById("time").value = data.time;
        document.getElementById("tema").value = data.tema;
        document.getElementById("priority").value = data.priority;

        const user = data.assigneeUser;

        // Получаем select
        const select = document.getElementById("select-user");

        // Очищаем select на всякий случай
        select.innerHTML = "";

        // Создаем новый <option>
        const option = document.createElement("option");
        if(user != null) {
            // Формируем строку в формате "firstName lastName (email)"
            const userText = `${user.firstName} ${user.lastName} (${user.email})`;
            const userValue = userText;
            option.value = userValue;
            option.textContent = userText;
        }
        else {
            const defaultText = "Пользователь не выбран";
            option.value = defaultText;
            option.textContent = defaultText;
        }

        option.selected = true;

        // Добавляем option в select
        select.appendChild(option);

        document.getElementById("status").value = data.status;
        document.getElementById("description").value = data.description;

        const form = document.querySelector(".form");

        // Удаляем старые кнопки, чтобы не дублировались
        document.getElementById("close-request")?.remove();
        document.getElementById("reopen-request")?.remove();
        document.getElementById("edit-request")?.remove();

        if (data.status === "OPEN") {
            const buttonGroup = document.createElement("div");
            buttonGroup.className = "button-group"; // Добавляем класс контейнера для кнопок

            const closeButton = document.createElement("button");
            closeButton.id = "close-request";
            closeButton.type = "button";
            closeButton.className = "submit-btn";
            closeButton.textContent = "Закрыть";

            const editButton = document.createElement("button" +
                "");
            editButton.id = "edit-request";
            editButton.type = "button";
            editButton.className = "submit-btn";
            editButton.textContent = "Редактировать";
            editButton.addEventListener("click", toggleEditMode);

            if(userRole === "ROLE_ADMIN" || userRole === "ROLE_USER") buttonGroup.appendChild(editButton);
            buttonGroup.appendChild(closeButton);
            form.appendChild(buttonGroup);
        }
        else {
            // Добавляем кнопку "Восстановить"
            const reopenButton = document.createElement("button");
            reopenButton.id = "reopen-request";
            reopenButton.type = "button";
            reopenButton.className = "submit-btn";
            reopenButton.textContent = "Восстановить";
            if(userRole === "ROLE_ADMIN" || userRole === "ROLE_USER") form.appendChild(reopenButton);
        }
    } catch (error) {
        console.error("Ошибка при загрузке заявки:", error);
    }
}

function toggleEditMode() {
    const inputs = document.querySelectorAll("#tema, #description, #status");
    const selects = document.querySelectorAll("#priority, #select-user"); // Получаем select
    const editButton = document.getElementById("edit-request");

    if (editButton.textContent === "Редактировать") {
        // Разрешаем редактирование input и textarea
        inputs.forEach(input => {
            input.removeAttribute("readonly");
            input.style.border = "1px solid #ccc"; // Визуальное изменение
        });

        // Разрешаем редактирование select
        selects.forEach(select => {
            select.removeAttribute("disabled");
            select.style.border = "1px solid #ccc"; // Добавляем стиль
        })

        editButton.textContent = "Сохранить";
        editButton.classList.add("save-mode");// Изменяем цвет на оранжевый
    } else {
        // Запрещаем редактирование input и textarea
        inputs.forEach(input => {
            input.setAttribute("readonly", "true");
        });

        // Запрещаем редактирование select
        selects.forEach(select => {
            select.setAttribute("disabled", "true");
        })

        editButton.textContent = "Редактировать";
        editButton.classList.remove("save-mode"); // Возвращаем красный цвет
        updateRequest();
    }
}

// Глобальная функция для обновления заявки
window.refreshRequestData = async function () {
    const id = window.location.pathname.split("/").pop();
    if (!isNaN(id)) {
        await loadTicketData(id);
    }
};

// Обработчик закрытия заявки
$(document).on('click', '#close-request', async function () {
    try {
        const csrf = await getCsrfToken();
        $.ajax({
            url: "/requestClose",
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(requestId),
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: function (data) {
                console.log("Request close:", data);
                showNotification(data.message, true);
                loadTicketData(requestId); // обновляем форму и кнопки
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
});

// Обработчик восстановления заявки
$(document).on('click', '#reopen-request', async function () {
    try {
        const csrf = await getCsrfToken();
        $.ajax({
            url: "/reopenRequest",
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(requestId),
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: function (data) {
                console.log("Request reopen:", data);
                showNotification(data.message, true);
                loadTicketData(requestId); // обновляем форму и кнопки
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
});
