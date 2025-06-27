// tickets.js — загрузка и рендер всех тикетов

// Импортируем showNotification из глобального window (оригинальный дизайн)
const showNotification = window.showNotification;

export async function renderTicketsPage() {
    const content = document.getElementById('spa-content');
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
    document.getElementById('spa-create-link').onclick = () => {
        window.location.hash = '#/create';
    };
    document.getElementById('spa-close-link').onclick = () => {
        window.location.hash = '#/close';
    };
    document.getElementById('spa-users-link').onclick = () => {
        window.location.hash = '#/users';
    };
    await loadTickets();
}

async function loadTickets() {
    const tbody = document.getElementById('tickets-tbody');
    tbody.innerHTML = '<tr><td colspan="8">Загрузка...</td></tr>';
    try {
        const response = await fetch('/getRequestsOpen');
        if (!response.ok) throw new Error('Ошибка загрузки тикетов');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('Некорректный формат данных');
        tbody.innerHTML = '';
        data.forEach(ticket => {
            tbody.appendChild(createTicketRow(ticket));
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;">${e.message}</td></tr>`;
    }
}

function createTicketRow(ticket) {
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
                <button class="action-btn edit" title="Редактировать" onclick="window.location.href='/editRequest/${ticket.id}'"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" title="Закрыть" onclick="showCloseModal(${ticket.id})"><i class="fas fa-times"></i></button>
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

// Модалка закрытия тикета (заглушка)
window.showCloseModal = function(id) {
    alert('Закрытие тикета #' + id + ' (реализовать модалку)');
}

// Заглушка для страницы создания тикета
export function renderCreateTicketPage() {
    const content = document.getElementById('spa-content');
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