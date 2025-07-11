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

// --- Новые функции для загрузки компаний, серверов, контактов ---
async function loadCompanies(selectedId) {
    try {
        const response = await fetch('/api/companies');
        if (!response.ok) throw new Error('Ошибка загрузки компаний');
        const companies = await response.json();
        const companySelect = document.getElementById('select-company');
        companySelect.innerHTML = '<option value="" disabled>Выберите компанию</option>';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            if (selectedId && company.id == selectedId) option.selected = true;
            companySelect.appendChild(option);
        });
    } catch (e) { showNotification('Ошибка загрузки компаний', 'error'); }
}

async function loadUsers(selectedId) {
    try {
        console.log("loadUsers called with selectedId:", selectedId);
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Ошибка загрузки пользователей');
        const users = await response.json();
        console.log("Loaded users:", users);
        
        const userSelect = document.getElementById('assignee-user');
        userSelect.innerHTML = '<option value="" disabled>Выберите исполнителя</option>';
        
        // Добавляем опцию "Не назначен"
        const noAssigneeOption = document.createElement('option');
        noAssigneeOption.value = "";
        noAssigneeOption.textContent = "Не назначен";
        if (!selectedId || selectedId === "") noAssigneeOption.selected = true;
        userSelect.appendChild(noAssigneeOption);
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.firstName} ${user.lastName} (${user.email})`;
            if (selectedId && user.id == selectedId) {
                option.selected = true;
                console.log("Selected user:", user.firstName, user.lastName);
            }
            userSelect.appendChild(option);
        });
        
        console.log("Final select value:", userSelect.value);
    } catch (e) { 
        console.error("Error in loadUsers:", e);
        showNotification('Ошибка загрузки пользователей', 'error'); 
    }
}

async function loadServersByCompany(companyId, selectedId) {
    try {
        const response = await fetch(`/api/servers/${companyId}`);
        if (!response.ok) throw new Error('Ошибка загрузки серверов');
        const servers = await response.json();
        const serverSelect = document.getElementById('select-server');
        serverSelect.innerHTML = '<option value="" disabled>Выберите сервер</option>';
        servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            if (selectedId && server.id == selectedId) option.selected = true;
            serverSelect.appendChild(option);
        });
    } catch (e) { showNotification('Ошибка загрузки серверов', 'error'); }
}

// --- Основная функция загрузки заявки ---
async function loadTicketData(id) {
    try {
        const userRole = localStorage.getItem("role");
        const response = await fetch(`/getRequest/${id}`);
        if (response.status === 403) {
            const errorMessage = await response.text();
            showNotification(errorMessage, 'error');
            return;
        }
        if (!response.ok) throw new Error("Ошибка при загрузке данных");
        const data = await response.json();
        // Заполняем поля
        document.getElementById("tema").value = data.tema;
        document.getElementById("priority").value = data.priority;
        document.getElementById("description").value = data.description;
        document.getElementById("contacts").value = data.contacts || '';
        
        // Отображаем информацию о пользователях
        if (data.createUser) {
            document.getElementById("creator-info").textContent = 
                `${data.createUser.firstName} ${data.createUser.lastName} (${data.createUser.email})`;
        }
        
        if (data.closedByUser) {
            document.getElementById("closed-by-info").textContent = 
                `${data.closedByUser.firstName} ${data.closedByUser.lastName} (${data.closedByUser.email})`;
            document.getElementById("closed-by-container").style.display = "flex";
        } else {
            document.getElementById("closed-by-container").style.display = "none";
        }
        
        // Загружаем пользователей для select исполнителя
        console.log("Loading users for assignee:", data.assigneeUser?.id);
        await loadUsers(data.assigneeUser?.id);
        
        // Компании и серверы
        await loadCompanies(data.company?.id);
        if (data.company?.id) {
            document.getElementById('select-company').disabled = true;
            await loadServersByCompany(data.company.id, data.server?.id);
            document.getElementById('select-server').disabled = true;
        }
        // Кнопки и режимы
        setupEditButtons(data, userRole);
    } catch (error) {
        console.error("Ошибка при загрузке заявки:", error);
    }
}

function setupEditButtons(data, userRole) {
    const btns = document.getElementById('edit-buttons');
    btns.innerHTML = '';
    if (data.status === "OPEN") {
        if(userRole === "ROLE_ADMIN" || userRole === "ROLE_USER") {
            const editBtn = document.createElement('button');
            editBtn.id = 'edit-request';
            editBtn.type = 'button';
            editBtn.className = 'submit-btn';
            editBtn.textContent = 'Редактировать';
            editBtn.onclick = toggleEditMode;
            btns.appendChild(editBtn);
        }
        const closeBtn = document.createElement('button');
        closeBtn.id = 'close-request';
        closeBtn.type = 'button';
        closeBtn.className = 'submit-btn';
        closeBtn.textContent = 'Закрыть';
        closeBtn.onclick = closeRequest;
        btns.appendChild(closeBtn);
    } else {
        if(userRole === "ROLE_ADMIN" || userRole === "ROLE_USER") {
            const reopenBtn = document.createElement('button');
            reopenBtn.id = 'reopen-request';
            reopenBtn.type = 'button';
            reopenBtn.className = 'submit-btn';
            reopenBtn.textContent = 'Восстановить';
            reopenBtn.onclick = reopenRequest;
            btns.appendChild(reopenBtn);
        }
    }
}

function toggleEditMode() {
    const isEdit = document.getElementById('edit-request').textContent === 'Редактировать';
    ["tema", "priority", "select-company", "select-server", "contacts", "description", "assignee-user"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (isEdit) {
                el.removeAttribute('readonly');
                el.removeAttribute('disabled');
                el.style.border = '1px solid #ccc';
            } else {
                el.setAttribute('readonly', 'true');
                el.setAttribute('disabled', 'true');
                el.style.border = '';
            }
        }
    });
    const btn = document.getElementById('edit-request');
    if (isEdit) {
        btn.textContent = 'Сохранить';
        btn.classList.add('save-mode');
        // Включить обработчик выбора компании
        document.getElementById('select-company').addEventListener('change', onCompanyChange);
    } else {
        btn.textContent = 'Редактировать';
        btn.classList.remove('save-mode');
        // Сохранить изменения
        updateRequest();
    }
}

async function onCompanyChange(e) {
    const companyId = e.target.value;
    await loadServersByCompany(companyId);
}

async function updateRequest() {
    try {
        const tema = document.getElementById('tema').value;
        const priority = document.getElementById('priority').value;
        const companyId = parseInt(document.getElementById('select-company').value);
        const serverId = parseInt(document.getElementById('select-server').value);
        const contacts = document.getElementById('contacts').value;
        const description = document.getElementById('description').value;
        const assigneeUserId = document.getElementById('assignee-user').value || null;
        
        // Если значение пустая строка, преобразуем в null
        const finalAssigneeUserId = assigneeUserId === "" ? null : assigneeUserId;
        
        console.log("Sending assigneeUserId:", finalAssigneeUserId);
        
        const csrf = await getCsrfToken();
        const payload = {
            tema, priority, companyId, serverId, contacts, description,
            assigneeUserId: finalAssigneeUserId, requestId
        };
        
        console.log("Update payload:", payload);
        $.ajax({
            url: '/updateRequest',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: function(data) {
                showNotification('Заявка обновлена', 'success');
                loadTicketData(requestId);
            },
            error: function(error) {
                showNotification('Ошибка обновления: ' + (error.responseJSON?.message || error.statusText), 'error');
            }
        });
    } catch (e) {
        showNotification('Ошибка обновления: ' + e.message, 'error');
    }
}

async function closeRequest() {
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
}

async function reopenRequest() {
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
}

// Глобальная функция для обновления заявки
window.refreshRequestData = async function () {
    const id = window.location.pathname.split("/").pop();
    if (!isNaN(id)) {
        await loadTicketData(id);
    }
};
