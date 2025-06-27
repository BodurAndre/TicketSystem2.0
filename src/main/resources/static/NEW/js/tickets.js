// tickets.js — загрузка и рендер всех тикетов

// Импортируем showNotification из глобального window (оригинальный дизайн)
const showNotification = window.showNotification;

export async function init() {
    await renderTicketsPage();
    // Обновляем статистику после полной загрузки страницы
    await updateTicketStats();
}

export async function renderTicketsPage() {
    const content = document.getElementById('app');
    content.innerHTML = `
        <div class="table-header">
            <h2><i class="fas fa-list"></i> Список тикетов</h2>
            <div class="table-actions">
                <button class="refresh-btn" id="refresh-tickets-btn">
                    <i class="fas fa-sync-alt"></i> Обновить
                </button>
            </div>
        </div>
        <div class="table-wrapper">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th class="request"><i class="fas fa-hashtag"></i> ID</th>
                        <th class="date"><i class="fas fa-calendar"></i> Дата</th>
                        <th class="time"><i class="fas fa-clock"></i> Время</th>
                        <th class="tema"><i class="fas fa-tag"></i> Тема</th>
                        <th class="priority"><i class="fas fa-exclamation-triangle"></i> Приоритет</th>
                        <th class="from"><i class="fas fa-user"></i> От</th>
                        <th class="status"><i class="fas fa-info-circle"></i> Статус</th>
                        <th class="edit"><i class="fas fa-cogs"></i> Действие</th>
                    </tr>
                </thead>
                <tbody id="tickets-tbody"></tbody>
            </table>
        </div>
    `;
    document.getElementById('refresh-tickets-btn').onclick = loadTickets;
    await loadTickets();
}

async function loadTickets() {
    const tbody = document.getElementById('tickets-tbody');
    tbody.innerHTML = '<tr><td colspan="8">Загрузка...</td></tr>';
    try {
        const response = await fetch('/requests');
        if (!response.ok) throw new Error('Ошибка загрузки тикетов');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Некорректный формат данных');
        tbody.innerHTML = '';
        data.forEach(ticket => {
            tbody.appendChild(createTicketRow(ticket));
        });
        // Обновляем статистику после загрузки тикетов
        await updateTicketStats();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;">${e.message}</td></tr>`;
    }
}

// Функция для обновления статистики тикетов
export async function updateTicketStats() {
    try {
        // Получаем все тикеты
        const allTicketsResponse = await fetch('/requests');
        if (!allTicketsResponse.ok) throw new Error('Ошибка загрузки всех тикетов');
        const allTickets = await allTicketsResponse.json();
        
        // Получаем открытые тикеты
        const openTicketsResponse = await fetch('/getRequestsOpen');
        if (!openTicketsResponse.ok) throw new Error('Ошибка загрузки открытых тикетов');
        const openTickets = await openTicketsResponse.json();
        
        // Обновляем DOM-элементы
        const totalTicketsElement = document.getElementById('total-tickets');
        const openTicketsElement = document.getElementById('open-tickets');
        
        if (totalTicketsElement) {
            totalTicketsElement.textContent = Array.isArray(allTickets) ? allTickets.length : 0;
        }
        
        if (openTicketsElement) {
            openTicketsElement.textContent = Array.isArray(openTickets) ? openTickets.length : 0;
        }
    } catch (e) {
        console.error('Ошибка обновления статистики тикетов:', e);
        // В случае ошибки устанавливаем 0
        const totalTicketsElement = document.getElementById('total-tickets');
        const openTicketsElement = document.getElementById('open-tickets');
        
        if (totalTicketsElement) {
            totalTicketsElement.textContent = '0';
        }
        
        if (openTicketsElement) {
            openTicketsElement.textContent = '0';
        }
    }
}

function createTicketRow(ticket) {
    const tr = document.createElement('tr');
    let actions = '';
    if (ticket.status === 'OPEN') {
        actions = `
            <button class="action-btn edit" title="Редактировать" onclick="window.location.href='/#request-id${ticket.id}'"><i class="fas fa-edit"></i></button>
            <button class="action-btn delete" title="Закрыть" onclick="showCloseModal(${ticket.id})"><i class="fas fa-times"></i></button>
        `;
    } else {
        actions = `
            <button class="action-btn edit" title="Редактировать" onclick="window.location.href='/#request-id${ticket.id}'"><i class="fas fa-edit"></i></button>
            <button class="action-btn restore" title="Восстановить" onclick="showReopenModal(${ticket.id})"><i class="fas fa-undo"></i></button>
        `;
    }
    tr.innerHTML = `
        <td class="request">#${ticket.id}</td>
        <td class="date">${formatDate(ticket.data)}</td>
        <td class="time">${formatTime(ticket.time)}</td>
        <td class="tema">${ticket.tema}</td>
        <td class="priority"><span class="priority-badge ${getPriorityClass(ticket.priority)}">${ticket.priority}</span></td>
        <td class="from">${ticket.createUser ? ticket.createUser.firstName + ' ' + ticket.createUser.lastName : '—'}</td>
        <td class="status"><span class="status-badge ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
        <td class="edit">
            <div class="action-buttons">
                ${actions}
            </div>
        </td>
    `;
    return tr;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU');
}
function formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr.length > 5 ? timeStr.substring(0,5) : timeStr;
}
function getPriorityClass(priority) {
    switch(priority) {
        case 'HIGH': return 'priority-high';
        case 'MEDIUM': return 'priority-medium';
        case 'LOW': return 'priority-low';
        default: return '';
    }
}
function getStatusClass(status) {
    switch(status) {
        case 'OPEN': return 'status-open';
        case 'CLOSED': return 'status-closed';
        default: return '';
    }
}

// Модалка закрытия тикета
window.showCloseModal = function(id) {
    // Удаляем старое окно, если оно есть
    document.getElementById('close-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'close-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.3)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10001';

    modal.innerHTML = `
        <div style="background: #fff; border-radius: 12px; padding: 32px 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); min-width: 320px; max-width: 90vw; text-align: center;">
            <h3 style="margin-bottom: 18px; color: #e74c3c;"><i class='fas fa-exclamation-triangle'></i> Подтвердите закрытие</h3>
            <p style="margin-bottom: 24px; color: #333;">Вы действительно хотите закрыть заявку <b>#${id}</b>?</p>
            <div style="display: flex; gap: 18px; justify-content: center;">
                <button id="close-confirm" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Да, Закрыть</button>
                <button id="close-cancel" style="background: #f3f3f3; color: #333; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Нет</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-cancel').onclick = () => modal.remove();
    document.getElementById('close-confirm').onclick = () => {
        modal.remove();
        closeRequest(id);
    };
}

// AJAX-запрос на закрытие заявки
async function closeRequest(requestId) {
    try {
        const csrf = await getCsrfToken();
        const response = await fetch('/requestClose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [csrf.headerName]: csrf.token
            },
            body: JSON.stringify(requestId),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Ошибка при закрытии заявки');
        const data = await response.json();
        if (typeof showNotification === 'function') {
            showNotification(data.message || 'Заявка закрыта!', 'success');
        } else {
            alert(data.message || 'Заявка закрыта!');
        }
        // После закрытия заявки переходим на закрытые заявки
        window.location.hash = '#closed';
    } catch (error) {
        if (typeof showNotification === 'function') {
            showNotification(error.message || 'Ошибка при закрытии', 'error');
        } else {
            alert(error.message || 'Ошибка при закрытии');
        }
    }
}

// Заглушка для страницы создания тикета
export function renderCreateTicketPage() {
    const content = document.getElementById('app');
    content.innerHTML = `
        <div class="spa-nav-links">
            <span class="spa-link active">Создать тикет</span>
            <span class="spa-link" id="spa-close-link">Закрытые заявки</span>
            <span class="spa-link" id="spa-users-link">Пользователи</span>
        </div>
        <div class="table-header">
            <h2><i class='fas fa-plus-circle'></i> Создать тикет</h2>
        </div>
        <div class="table-wrapper" style="max-width:600px;margin:0 auto;">
            <form id="create-request-form">
                <div class="input-group" style="display:flex;gap:16px;">
                    <div class="input-item" style="flex:1;">
                        <label for="tema">Заголовок:</label>
                        <input type="text" id="tema" name="tema" placeholder="Введите тему" required style="width:100%;">
                    </div>
                    <div class="input-item" style="flex:1;">
                        <label for="priority">Приоритет:</label>
                        <select id="priority" name="priority" required style="width:100%;">
                            <option value="" disabled selected>Выберите приоритет</option>
                            <option value="LOW">Низкий</option>
                            <option value="MEDIUM">Средний</option>
                            <option value="HIGH">Высокий</option>
                        </select>
                    </div>
                </div>
                <div class="input-group" style="margin-top:16px;">
                    <div class="input-item" style="width:100%;">
                        <label for="select-user">Пользователь:</label>
                        <select id="select-user" name="userId" required style="width:100%;">
                            <option value="" disabled selected>Выберите пользователя</option>
                        </select>
                    </div>
                </div>
                <div class="input-group" style="margin-top:16px;">
                    <label for="description">Описание:</label>
                    <textarea id="description" name="description" placeholder="Введите описание" required style="width:100%;min-height:80px;"></textarea>
                </div>
                <div style="margin-top:24px;text-align:right;">
                    <button id="open-request" type="submit" class="refresh-btn">
                        <i class="fas fa-paper-plane"></i> Создать
                    </button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('spa-close-link').onclick = () => {
        window.location.hash = '#/close';
    };
    document.getElementById('spa-users-link').onclick = () => {
        window.location.hash = '#/users';
    };
    loadUsersForSelect();
    bindCreateRequestForm();
}

function loadUsersForSelect() {
    const select = document.getElementById('select-user');
    select.innerHTML = '<option value="" disabled selected>Загрузка...</option>';
    fetch('/getDTOUser')
        .then(r => r.json())
        .then(users => {
            select.innerHTML = '<option value="" disabled selected>Выберите пользователя</option>';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.firstName} ${user.lastName} (${user.email})`;
                select.appendChild(option);
            });
        })
        .catch(() => {
            select.innerHTML = '<option value="" disabled selected>Ошибка загрузки пользователей</option>';
        });
}

function bindCreateRequestForm() {
    const form = document.getElementById('create-request-form');
    form.onsubmit = async function(event) {
        event.preventDefault();
        const tema = form.tema.value.trim();
        const priority = form.priority.value;
        const description = form.description.value.trim();
        const userId = form['userId'].value;
        if (!tema || !priority || !description || !userId) return;
        try {
            const csrf = await getCsrfToken();
            const requestData = {
                tema,
                priority,
                description,
                user: userId
            };
            const response = await fetch('/RequestCreate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [csrf.headerName]: csrf.token
                },
                body: JSON.stringify(requestData),
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Ошибка создания тикета');
            const data = await response.json();
            if (typeof showNotification === 'function') {
                showNotification(data.message || 'Тикет создан!', 'success');
            } else {
                alert(data.message || 'Тикет создан!');
            }
            setTimeout(() => window.location.hash = '#/', 1200);
        } catch (e) {
            if (typeof showNotification === 'function') {
                showNotification(e.message || 'Ошибка', 'error');
            } else {
                alert(e.message || 'Ошибка');
            }
        }
    };
}

async function getCsrfToken() {
    const r = await fetch('/csrf-token', { credentials: 'include' });
    if (!r.ok) throw new Error('CSRF error');
    return await r.json();
}

// SPA: обработка кнопки 'Закрытые заявки'
document.addEventListener('DOMContentLoaded', () => {
    const closedBtn = document.getElementById('show-closed-tickets-btn');
    if (closedBtn) {
        closedBtn.onclick = () => {
            window.location.hash = '#closed';
        };
    }
});

export async function renderClosedTicketsPage() {
    const content = document.getElementById('app');
    content.innerHTML = `
        <div class="table-header">
            <h2><i class="fas fa-archive"></i> Закрытые заявки</h2>
            <div class="table-actions">
                <button class="refresh-btn" id="refresh-closed-tickets-btn">
                    <i class="fas fa-sync-alt"></i> Обновить
                </button>
                <button class="refresh-btn" id="show-open-tickets-btn">
                    <i class="fas fa-list"></i> Открытые заявки
                </button>
            </div>
        </div>
        <div class="table-wrapper">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th class="request"><i class="fas fa-hashtag"></i> ID</th>
                        <th class="date"><i class="fas fa-calendar"></i> Дата</th>
                        <th class="time"><i class="fas fa-clock"></i> Время</th>
                        <th class="tema"><i class="fas fa-tag"></i> Тема</th>
                        <th class="priority"><i class="fas fa-exclamation-triangle"></i> Приоритет</th>
                        <th class="from"><i class="fas fa-user"></i> От</th>
                        <th class="status"><i class="fas fa-info-circle"></i> Статус</th>
                        <th class="edit"><i class="fas fa-cogs"></i> Действие</th>
                    </tr>
                </thead>
                <tbody id="closed-tickets-tbody"></tbody>
            </table>
        </div>
    `;
    document.getElementById('refresh-closed-tickets-btn').onclick = loadClosedTickets;
    document.getElementById('show-open-tickets-btn').onclick = () => {
        window.location.hash = '#';
    };
    await loadClosedTickets();
}

async function loadClosedTickets() {
    const tbody = document.getElementById('closed-tickets-tbody');
    tbody.innerHTML = '<tr><td colspan="8">Загрузка...</td></tr>';
    try {
        const response = await fetch('/getRequestsClose');
        if (!response.ok) throw new Error('Ошибка загрузки закрытых тикетов');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Некорректный формат данных');
        tbody.innerHTML = '';
        data.forEach(ticket => {
            tbody.appendChild(createClosedTicketRow(ticket));
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;">${e.message}</td></tr>`;
    }
}

function createClosedTicketRow(ticket) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="request">#${ticket.id}</td>
        <td class="date">${formatDate(ticket.data)}</td>
        <td class="time">${formatTime(ticket.time)}</td>
        <td class="tema">${ticket.tema}</td>
        <td class="priority"><span class="priority-badge ${getPriorityClass(ticket.priority)}">${ticket.priority}</span></td>
        <td class="from">${ticket.createUser ? ticket.createUser.firstName + ' ' + ticket.createUser.lastName : '—'}</td>
        <td class="status"><span class="status-badge ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
        <td class="edit">
            <div class="action-buttons">
                <button class="action-btn edit" title="Редактировать" onclick="window.location.href='/#request-id${ticket.id}'"><i class="fas fa-edit"></i></button>
                <button class="action-btn restore" title="Восстановить" onclick="showReopenModal(${ticket.id})"><i class="fas fa-undo"></i></button>
            </div>
        </td>
    `;
    return tr;
}

// Модалка восстановления тикета
window.showReopenModal = function(id) {
    document.getElementById('reopen-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'reopen-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.3)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10001';
    modal.innerHTML = `
        <div style="background: #fff; border-radius: 12px; padding: 32px 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); min-width: 320px; max-width: 90vw; text-align: center;">
            <h3 style="margin-bottom: 18px; color: #27ae60;"><i class='fas fa-undo'></i> Подтвердите восстановление</h3>
            <p style="margin-bottom: 24px; color: #333;">Вы действительно хотите восстановить заявку <b>#${id}</b>?</p>
            <div style="display: flex; gap: 18px; justify-content: center;">
                <button id="reopen-confirm" style="background: linear-gradient(135deg, #27ae60, #16a085); color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Да, Восстановить</button>
                <button id="reopen-cancel" style="background: #f3f3f3; color: #333; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Нет</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('reopen-cancel').onclick = () => modal.remove();
    document.getElementById('reopen-confirm').onclick = () => {
        modal.remove();
        reopenRequest(id);
    };
}

// AJAX-запрос на восстановление заявки
async function reopenRequest(requestId) {
    try {
        const csrf = await getCsrfToken();
        const response = await fetch('/reopenRequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [csrf.headerName]: csrf.token
            },
            body: JSON.stringify(requestId),
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Ошибка при восстановлении заявки');
        const data = await response.json();
        if (typeof showNotification === 'function') {
            showNotification(data.message || 'Заявка восстановлена!', 'success');
        } else {
            alert(data.message || 'Заявка восстановлена!');
        }
        // Обновляем таблицу после восстановления
        await loadClosedTickets();
        await updateTicketStats();
    } catch (error) {
        if (typeof showNotification === 'function') {
            showNotification(error.message || 'Ошибка при восстановлении', 'error');
        } else {
            alert(error.message || 'Ошибка при восстановлении');
        }
    }
} 