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
        console.log(data);
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
        
        // Получаем email текущего пользователя
        try {
            const userResponse = await fetch('/getCurrentUser');
            if (userResponse.ok) {
                const userData = await userResponse.json();
                currentUserEmail = userData.email;
            }
        } catch (e) {
            console.error('Ошибка получения данных пользователя:', e);
        }
        
        // Управляем доступностью формы комментариев
        const commentForm = document.querySelector('.comment-form');
        const commentText = document.getElementById('comment-text');
        const sendButton = document.getElementById('send-comment');
        
        if (data.status === "CLOSED") {
            commentForm.style.opacity = "0.5";
            commentText.disabled = true;
            sendButton.disabled = true;
            commentText.placeholder = "Комментарии недоступны для закрытых заявок";
        } else {
            commentForm.style.opacity = "1";
            commentText.disabled = false;
            sendButton.disabled = false;
            commentText.placeholder = "Введите комментарий...";
        }
        
        // Загружаем комментарии
        await loadComments(requestId);
        
        // Инициализируем обработчики файлов (включая кнопку отправки)
        initFileHandlers();

        // Сохраняем исходные данные заявки
        originalRequestData = { ...data };
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
            success: async function(data) {
                showNotification('Заявка обновлена', 'success');
                
                // Получаем обновленные данные заявки для сравнения
                const response = await fetch(`/getRequest/${requestId}`);
                if (response.ok) {
                    const updatedData = await response.json();
                    const changes = getRequestChanges(updatedData);
                    
                    // Получаем информацию о текущем пользователе
                    let editorInfo = "Заявка обновлена";
                    if (currentUserEmail) {
                        const userResponse = await fetch('/getCurrentUser');
                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            editorInfo = `Заявка обновлена пользователем ${userData.firstName} ${userData.lastName}`;
                        }
                    }
                    
                    // Создаем системный комментарий с деталями изменений
                    if (changes.length > 0) {
                        await createSystemComment(editorInfo, changes);
                    } else {
                        await createSystemComment(editorInfo);
                    }
                    
                    // Обновляем исходные данные
                    originalRequestData = { ...updatedData };
                }
                
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
            success: async function (data) {
                console.log("Request close:", data);
                showNotification(data.message, true);
                
                // Получаем информацию о текущем пользователе
                let closeInfo = "Заявка закрыта";
                if (currentUserEmail) {
                    const userResponse = await fetch('/getCurrentUser');
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        closeInfo = `Заявка закрыта пользователем ${userData.firstName} ${userData.lastName}`;
                    }
                }
                
                // Создаем системный комментарий о закрытии
                await createSystemComment(closeInfo);
                
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
    // Показываем модальное окно для комментария
    showReopenModal();
}

// Функция для показа модального окна восстановления
function showReopenModal() {
    const modalHtml = `
        <div id="reopen-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Восстановление заявки</h3>
                    <button class="modal-close" id="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Введите комментарий к восстановлению заявки (необязательно):</p>
                    <textarea id="reopen-comment" placeholder="Введите комментарий..." rows="4"></textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="modal-cancel-btn">Отмена</button>
                    <button class="btn-primary" id="modal-confirm-btn">Восстановить</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Добавляем обработчики событий
    const modal = document.getElementById('reopen-modal');
    const modalContent = modal.querySelector('.modal-content');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    // Закрытие по клику на крестик
    closeBtn.addEventListener('click', closeReopenModal);
    
    // Закрытие по клику на "Отмена"
    cancelBtn.addEventListener('click', closeReopenModal);
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeReopenModal();
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeReopenModal();
        }
    });
    
    // Подтверждение восстановления
    confirmBtn.addEventListener('click', confirmReopen);
    
    // Фокус на поле ввода
    setTimeout(() => {
        document.getElementById('reopen-comment').focus();
    }, 100);
}

// Функция для закрытия модального окна
function closeReopenModal() {
    const modal = document.getElementById('reopen-modal');
    if (modal) {
        // Удаляем обработчик Escape
        document.removeEventListener('keydown', closeReopenModal);
        modal.remove();
    }
}

// Функция для подтверждения восстановления
async function confirmReopen() {
    const commentText = document.getElementById('reopen-comment').value.trim();
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    // Показываем индикатор загрузки
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Восстановление...';
    
    try {
        const csrf = await getCsrfToken();
        
        // Сначала закрываем модальное окно
        closeReopenModal();
        
        $.ajax({
            url: "/reopenRequest",
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(requestId),
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: async function (data) {
                console.log("Request reopen:", data);
                showNotification(data.message, true);
                
                // Получаем информацию о текущем пользователе
                let reopenInfo = "Заявка восстановлена";
                if (currentUserEmail) {
                    const userResponse = await fetch('/getCurrentUser');
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        reopenInfo = `Заявка восстановлена пользователем ${userData.firstName} ${userData.lastName}`;
                    }
                }
                
                // Создаем системный комментарий о восстановлении
                if (commentText) {
                    reopenInfo += `. ${commentText}`;
                }
                await createSystemComment(reopenInfo);
                
                loadTicketData(requestId); // обновляем форму и кнопки
            },
            error: function (error) {
                console.error("Error:", error);
                showNotification("Code " + error.status + " : " + error.responseJSON?.error, false);
                
                // Восстанавливаем кнопку в случае ошибки
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Восстановить';
            }
        });
    } catch (error) {
        console.error("Error:", error);
        showNotification("Ошибка", false);
        
        // Восстанавливаем кнопку в случае ошибки
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Восстановить';
    }
}

// --- Функции для работы с комментариями ---
let currentUserEmail = null;
let originalRequestData = null; // Для отслеживания изменений

async function loadComments(requestId) {
    try {
        const response = await fetch(`/api/comments/${requestId}`);
        if (!response.ok) throw new Error('Ошибка загрузки комментариев');
        const comments = await response.json();
        displayComments(comments);
    } catch (e) {
        console.error('Ошибка загрузки комментариев:', e);
        showNotification('Ошибка загрузки комментариев', 'error');
    }
}

function displayComments(comments) {
    const container = document.getElementById('comments-container');
    container.innerHTML = '';
    
    if (comments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Комментариев пока нет</p>';
        return;
    }
    
    comments.forEach(comment => {
        const commentElement = createCommentElement(comment);
        container.appendChild(commentElement);
    });
    
    // Прокручиваем к последнему комментарию
    container.scrollTop = container.scrollHeight;
}

function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    
    // Определяем тип комментария
    if (comment.isSystem) {
        commentDiv.classList.add('system-comment');
    } else if (comment.userEmail === currentUserEmail) {
        commentDiv.classList.add('my-comment');
    } else {
        commentDiv.classList.add('other-comment');
    }
    
    const date = new Date(comment.createdAt).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let filesHtml = '';
    if (comment.files && comment.files.length > 0) {
        filesHtml = '<div class="comment-files">';
        comment.files.forEach(file => {
            filesHtml += createFileElement(file);
        });
        filesHtml += '</div>';
    }
    
    if (comment.isSystem) {
        let detailsHtml = '';
        if (comment.changeDetails) {
            detailsHtml = '<div class="comment-details">';
            comment.changeDetails.forEach(change => {
                detailsHtml += `<div class="change-item">${change}</div>`;
            });
            detailsHtml += '</div>';
        }
        
        commentDiv.innerHTML = `
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            ${detailsHtml}
            ${filesHtml}
            <div class="comment-date" style="text-align: right; margin-top: 5px; font-size: 11px;">${date}</div>
        `;
    } else {
        commentDiv.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.userName}</span>
                <span class="comment-date">${date}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            ${filesHtml}
        `;
    }
    
    return commentDiv;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Функция для отслеживания изменений в заявке
function getRequestChanges(newData) {
    if (!originalRequestData) return [];
    
    const changes = [];
    
    // Проверяем изменения в основных полях
    if (originalRequestData.tema !== newData.tema) {
        changes.push(`Заголовок: "${originalRequestData.tema}" → "${newData.tema}"`);
    }
    
    if (originalRequestData.priority !== newData.priority) {
        const priorityNames = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
        const oldPriority = priorityNames[originalRequestData.priority] || originalRequestData.priority;
        const newPriority = priorityNames[newData.priority] || newData.priority;
        changes.push(`Приоритет: ${oldPriority} → ${newPriority}`);
    }
    
    if (originalRequestData.contacts !== newData.contacts) {
        changes.push(`Контакты: "${originalRequestData.contacts || 'не указаны'}" → "${newData.contacts || 'не указаны'}"`);
    }
    
    if (originalRequestData.description !== newData.description) {
        changes.push(`Описание: изменено`);
    }
    
    // Проверяем изменения в связанных объектах
    if (originalRequestData.company?.id !== newData.company?.id) {
        const oldCompany = originalRequestData.company?.name || 'не выбрана';
        const newCompany = newData.company?.name || 'не выбрана';
        changes.push(`Компания: ${oldCompany} → ${newCompany}`);
    }
    
    if (originalRequestData.server?.id !== newData.server?.id) {
        const oldServer = originalRequestData.server?.name || 'не выбран';
        const newServer = newData.server?.name || 'не выбран';
        changes.push(`Сервер: ${oldServer} → ${newServer}`);
    }
    
    if (originalRequestData.assigneeUser?.id !== newData.assigneeUser?.id) {
        const oldAssignee = originalRequestData.assigneeUser ? 
            `${originalRequestData.assigneeUser.firstName} ${originalRequestData.assigneeUser.lastName}` : 'не назначен';
        const newAssignee = newData.assigneeUser ? 
            `${newData.assigneeUser.firstName} ${newData.assigneeUser.lastName}` : 'не назначен';
        changes.push(`Исполнитель: ${oldAssignee} → ${newAssignee}`);
    }
    
    return changes;
}

async function sendComment() {
    const commentText = document.getElementById('comment-text').value.trim();
    if (!commentText) {
        showNotification('Введите текст комментария', 'error');
        return;
    }
    
    const sendButton = document.getElementById('send-comment');
    sendButton.disabled = true;
    sendButton.textContent = 'Отправка...';
    
    try {
        const csrf = await getCsrfToken();
        const payload = {
            text: commentText,
            requestId: requestId
        };
        
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [csrf.headerName]: csrf.token
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка отправки комментария');
        }
        
        // Очищаем поле ввода
        document.getElementById('comment-text').value = '';
        
        // Перезагружаем комментарии
        await loadComments(requestId);
        
        showNotification('Комментарий отправлен', 'success');
    } catch (e) {
        console.error('Ошибка отправки комментария:', e);
        showNotification('Ошибка отправки комментария: ' + e.message, 'error');
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = 'Отправить комментарий';
    }
}

// Функция для создания системного комментария с деталями изменений
async function createSystemComment(text, changeDetails = null) {
    try {
        const csrf = await getCsrfToken();
        const payload = {
            text: text,
            requestId: requestId,
            isSystem: true,
            changeDetails: changeDetails
        };
        
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [csrf.headerName]: csrf.token
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        if (response.ok) {
            await loadComments(requestId);
        }
    } catch (e) {
        console.error('Ошибка создания системного комментария:', e);
    }
}

// Глобальная функция для обновления заявки
window.refreshRequestData = async function () {
    const id = window.location.pathname.split("/").pop();
    if (!isNaN(id)) {
        await loadTicketData(id);
    }
};

// === ФУНКЦИИ ДЛЯ РАБОТЫ С ФАЙЛАМИ ===

// Переменные для работы с файлами
let selectedFiles = [];

// Инициализация обработчиков для файлов
function initFileHandlers() {
    const fileInput = document.getElementById('comment-files');
    const sendButton = document.getElementById('send-comment');
    const commentText = document.getElementById('comment-text');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
    
    if (sendButton) {
        // Удаляем все предыдущие обработчики
        sendButton.removeEventListener('click', sendComment);
        sendButton.removeEventListener('click', handleSendComment);
        // Добавляем новый обработчик
        sendButton.addEventListener('click', handleSendComment);
    }
    
    if (commentText) {
        // Удаляем предыдущий обработчик Enter
        commentText.removeEventListener('keydown', handleEnterKey);
        // Добавляем новый обработчик Enter
        commentText.addEventListener('keydown', handleEnterKey);
    }
}

// Обработчик клавиши Enter
function handleEnterKey(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleSendComment(e);
    }
}

// Обработка выбора файлов
function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    selectedFiles = files;
    displaySelectedFiles();
}

// Отображение выбранных файлов
function displaySelectedFiles() {
    const container = document.getElementById('selected-files');
    container.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileIcon = getFileIcon(file.type);
        const fileSize = formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="file-icon ${fileIcon}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${fileSize})</span>
            </div>
            <button type="button" class="remove-file" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(fileItem);
    });
}

// Удаление файла из списка
function removeFile(index) {
    selectedFiles.splice(index, 1);
    displaySelectedFiles();
    
    // Обновляем input
    const fileInput = document.getElementById('comment-files');
    if (selectedFiles.length === 0) {
        fileInput.value = '';
    }
}

// Получение иконки для типа файла
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) {
        return 'fas fa-image';
    } else if (mimeType.startsWith('video/')) {
        return 'fas fa-video';
    } else if (mimeType.includes('pdf')) {
        return 'fas fa-file-pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
        return 'fas fa-file-word';
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
        return 'fas fa-file-archive';
    } else {
        return 'fas fa-file';
    }
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Обработка отправки комментария с файлами
async function handleSendComment(event) {
    event.preventDefault();
    
    const textArea = document.getElementById('comment-text');
    const text = textArea.value.trim();
    
    if (!text && selectedFiles.length === 0) {
        showNotification('Введите текст комментария или прикрепите файлы', 'warning');
        return;
    }
    
    if (!requestId) {
        showNotification('Ошибка: не найден ID заявки', 'error');
        return;
    }
    
    try {
        // Получаем CSRF токен
        const csrf = await getCsrfToken();
        
        const formData = new FormData();
        formData.append('text', text || '');
        formData.append('requestId', requestId);
        formData.append('isSystem', false);
        formData.append('_csrf', csrf.token); // Добавляем CSRF токен в FormData
        
        // Добавляем файлы
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
        
        const response = await fetch('/api/comments/with-files', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (response.ok) {
            textArea.value = '';
            selectedFiles = [];
            displaySelectedFiles();
            document.getElementById('comment-files').value = '';
            
            // Перезагружаем комментарии
            await loadComments(requestId);
            showNotification('Комментарий добавлен', 'success');
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || 'Ошибка при отправке комментария', 'error');
        }
    } catch (error) {
        console.error('Ошибка при отправке комментария:', error);
        showNotification('Ошибка при отправке комментария', 'error');
    }
}

// Создание элемента файла
function createFileElement(file) {
    const fileType = file.fileType;
    
    if (fileType === 'IMAGE') {
        return `
            <div class="comment-file image" onclick="openImageModal(${file.id}, '${file.fileName}')">
                <img src="/api/files/${file.id}/view" alt="${file.fileName}" class="comment-file-thumbnail" loading="lazy">
            </div>
        `;
    } else if (fileType === 'VIDEO') {
        return `
            <div class="comment-file video" onclick="openVideoModal(${file.id}, '${file.fileName}')">
                <video class="comment-file-thumbnail" muted preload="metadata">
                    <source src="/api/files/${file.id}/view" type="${file.contentType}">
                </video>
                <div class="video-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        `;
    } else {
        const fileIcon = getFileIcon(file.contentType);
        const fileSize = formatFileSize(file.fileSize);
        
        return `
            <div class="comment-file document" onclick="openDocumentModal(${file.id}, '${file.fileName}', '${file.contentType}', ${file.fileSize})">
                <div class="file-icon">
                    <i class="${fileIcon}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.fileName}</div>
                    <div class="file-size">${fileSize}</div>
                </div>
            </div>
        `;
    }
}

// Переменные для хранения текущего файла
let currentFileId = null;
let currentFileName = null;

// Модальные окна для просмотра медиа
window.openImageModal = function(fileId, fileName) {
    console.log('Opening image modal:', fileId, fileName);
    currentFileId = fileId;
    currentFileName = fileName;
    
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-image');
    
    if (!modal) {
        console.error('Image modal not found');
        return;
    }
    
    if (!img) {
        console.error('Modal image element not found');
        return;
    }
    
    img.src = `/api/files/${fileId}/view`;
    modal.style.display = 'flex';
    
    console.log('Modal displayed, image src set to:', img.src);
    
    // Закрытие по клику вне изображения
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeImageModal();
        }
    };
}

window.closeImageModal = function() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
    currentFileId = null;
    currentFileName = null;
}

window.openVideoModal = function(fileId, fileName) {
    currentFileId = fileId;
    currentFileName = fileName;
    
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    const source = video.querySelector('source');
    
    source.src = `/api/files/${fileId}/view`;
    video.load(); // Перезагружаем видео
    modal.style.display = 'flex';
    
    // Закрытие по клику вне видео
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeVideoModal();
        }
    };
}

window.closeVideoModal = function() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    
    video.pause();
    video.currentTime = 0;
    modal.style.display = 'none';
    currentFileId = null;
    currentFileName = null;
}

window.openDocumentModal = function(fileId, fileName, contentType, fileSize) {
    console.log('Opening document modal:', fileId, fileName, contentType, fileSize);
    currentFileId = fileId;
    currentFileName = fileName;
    
    const modal = document.getElementById('document-modal');
    const icon = document.getElementById('document-icon');
    const name = document.getElementById('document-name');
    const size = document.getElementById('document-size');
    
    if (!modal) {
        console.error('Document modal not found');
        return;
    }
    
    // Устанавливаем иконку в зависимости от типа файла
    const fileIcon = getFileIcon(contentType);
    if (icon) icon.className = fileIcon;
    
    if (name) name.textContent = fileName;
    if (size) size.textContent = formatFileSize(fileSize);
    
    modal.style.display = 'flex';
    
    console.log('Document modal displayed');
    
    // Закрытие по клику вне модального окна
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeDocumentModal();
        }
    };
}

window.closeDocumentModal = function() {
    const modal = document.getElementById('document-modal');
    modal.style.display = 'none';
    currentFileId = null;
    currentFileName = null;
}

// Функции скачивания
window.downloadImage = function() {
    console.log('Download image called:', currentFileId, currentFileName);
    if (currentFileId && currentFileName) {
        // Создаем временную ссылку для скачивания
        const link = document.createElement('a');
        link.href = `/api/files/${currentFileId}`;
        link.download = currentFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Download started for:', currentFileName);
    } else {
        console.error('No file ID or name available');
    }
}

window.downloadVideo = function() {
    if (currentFileId && currentFileName) {
        // Создаем временную ссылку для скачивания
        const link = document.createElement('a');
        link.href = `/api/files/${currentFileId}`;
        link.download = currentFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

window.downloadDocument = function() {
    if (currentFileId && currentFileName) {
        // Создаем временную ссылку для скачивания
        const link = document.createElement('a');
        link.href = `/api/files/${currentFileId}`;
        link.download = currentFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Закрытие модальных окон по клавише Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeImageModal();
        closeVideoModal();
        closeDocumentModal();
    }
});

// Инициализация обработчиков файлов при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация будет вызвана из loadTicketData()
});