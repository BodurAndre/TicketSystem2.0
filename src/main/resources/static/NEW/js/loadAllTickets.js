// loadAllTickets.js — точка входа для главной страницы тикетов

let allTickets = [];
let ticketSort = { field: null, asc: true };
let ticketFilters = { search: '', status: 'ALL', priority: 'ALL', date: 'ALL' };

export function init() {
    refreshTable();
    // Навешиваем обработчики после загрузки таблицы
    setTimeout(() => {
        // Используем глобальный поиск
        const globalSearch = document.querySelector('input[name="title"]');
        if (globalSearch) globalSearch.oninput = (e) => { ticketFilters.search = e.target.value; renderFilteredTickets(); };
        
        const status = document.getElementById('filter-status');
        if (status) status.onchange = (e) => { ticketFilters.status = e.target.value; renderFilteredTickets(); };
        
        const priority = document.getElementById('filter-priority');
        if (priority) priority.onchange = (e) => { ticketFilters.priority = e.target.value; renderFilteredTickets(); };
        
        const date = document.getElementById('filter-date');
        if (date) date.onchange = (e) => { ticketFilters.date = e.target.value; renderFilteredTickets(); };
        
        document.querySelectorAll('.modern-table th[data-sort]').forEach(th => {
            th.style.cursor = 'pointer';
            th.onclick = () => {
                const field = th.getAttribute('data-sort');
                if (ticketSort.field === field) {
                    ticketSort.asc = !ticketSort.asc;
                } else {
                    ticketSort.field = field;
                    ticketSort.asc = true;
                }
                renderFilteredTickets();
            };
        });
    }, 100);
}

export async function refreshTable() {
    $.ajax({
        url: '/requests',
        method: 'GET',
        success: function(data) {
            allTickets = data;
            renderFilteredTickets();
        },
        error: function (xhr, status, error) {
            console.error("Ошибка при загрузке данных: ", error);
        }
    });
}

function renderFilteredTickets() {
    let filtered = allTickets.filter(ticket => {
        const search = ticketFilters.search.trim().toLowerCase();
        let match = true;
        if (search) {
            match = (
                (ticket.tema && ticket.tema.toLowerCase().includes(search)) ||
                (ticket.description && ticket.description.toLowerCase().includes(search)) ||
                (ticket.createUser && ((ticket.createUser.firstName + ' ' + ticket.createUser.lastName).toLowerCase().includes(search)))
            );
        }
        if (ticketFilters.status !== 'ALL' && String(ticket.status).toUpperCase() !== ticketFilters.status) return false;
        if (ticketFilters.priority !== 'ALL' && String(ticket.priority).toUpperCase() !== ticketFilters.priority) return false;
        if (ticketFilters.date !== 'ALL' && !isDateMatch(ticket.data)) return false;
        return match;
    });
    
    // Сортировка
    if (ticketSort.field) {
        filtered.sort((a, b) => {
            let v1 = a[ticketSort.field];
            let v2 = b[ticketSort.field];
            if (ticketSort.field === 'from') {
                v1 = a.createUser ? (a.createUser.firstName + ' ' + a.createUser.lastName) : '';
                v2 = b.createUser ? (b.createUser.firstName + ' ' + b.createUser.lastName) : '';
            }
            if (typeof v1 === 'string') v1 = v1.toLowerCase();
            if (typeof v2 === 'string') v2 = v2.toLowerCase();
            if (v1 < v2) return ticketSort.asc ? -1 : 1;
            if (v1 > v2) return ticketSort.asc ? 1 : -1;
            return 0;
        });
    }
    
    // Стилизация стрелок сортировки
    document.querySelectorAll('.sort-arrow').forEach(el => el.innerHTML = '');
    if (ticketSort.field) {
        const arrow = document.getElementById('sort-' + ticketSort.field);
        if (arrow) {
            arrow.innerHTML = ticketSort.asc ? '<i class="fas fa-chevron-up" style="color:#3498db;font-size:0.9em;"></i>' : '<i class="fas fa-chevron-down" style="color:#3498db;font-size:0.9em;"></i>';
        }
    }
    
    let tableBody = document.querySelector("#ticketsTable tbody");
    tableBody.innerHTML = '';
    
    filtered.forEach(function(ticket) {
        let row = document.createElement('tr');
        
        let cellId = document.createElement('td');
        cellId.textContent = ticket.id;
        row.appendChild(cellId);
        
        let cellData = document.createElement('td');
        cellData.textContent = formatDate(ticket.data);
        row.appendChild(cellData);
        
        let cellTime = document.createElement('td');
        cellTime.textContent = formatTime(ticket.time);
        row.appendChild(cellTime);
        
        let cellTema = document.createElement('td');
        cellTema.textContent = ticket.tema;
        row.appendChild(cellTema);
        
        let cellCompany = document.createElement('td');
        if(ticket.company != null) {
            cellCompany.textContent = ticket.company.name;
        } else {
            cellCompany.textContent = "Не указана";
        }
        row.appendChild(cellCompany);
        
        let cellPriority = document.createElement('td');
        cellPriority.innerHTML = `<span class="priority-badge priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span>`;
        row.appendChild(cellPriority);
        
        let cellUser = document.createElement('td');
        if(ticket.createUser != null) {
            const user = ticket.createUser;
            const userText = `${user.firstName} ${user.lastName} (${user.email})`;
            cellUser.textContent = userText;
        } else {
            cellUser.textContent = "Пользователь не выбран";
        }
        row.appendChild(cellUser);
        
        let cellStatus = document.createElement('td');
        cellStatus.innerHTML = `<span class="status-badge status-${ticket.status.toLowerCase()}">${ticket.status}</span>`;
        row.appendChild(cellStatus);
        
        let cellAction = document.createElement('td');
        cellAction.className = 'edit';
        let actionDiv = document.createElement('div');
        actionDiv.className = 'action-buttons';
        
        let editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit';
        editBtn.title = 'Редактировать';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = '#request-id' + ticket.id;
        });
        actionDiv.appendChild(editBtn);
        
        let deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete';
        deleteBtn.title = 'Закрыть';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showDeleteModal(ticket.id);
        });
        actionDiv.appendChild(deleteBtn);
        
        cellAction.appendChild(actionDiv);
        row.appendChild(cellAction);
        
        tableBody.appendChild(row);
    });
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#aaa;">Нет тикетов</td></tr>';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            // Если дата в формате DD.MM.YYYY
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                return dateStr; // Возвращаем как есть
            }
        }
        return date.toLocaleDateString('ru-RU');
    } catch (e) {
        return dateStr;
    }
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr;
}

function isDateMatch(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    let ticketDate;
    try {
        ticketDate = new Date(dateStr);
        if (isNaN(ticketDate.getTime())) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                ticketDate = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
    } catch (e) {
        return false;
    }
    
    switch (ticketFilters.date) {
        case 'TODAY':
            return ticketDate.toDateString() === today.toDateString();
        case 'YESTERDAY':
            return ticketDate.toDateString() === yesterday.toDateString();
        case 'WEEK':
            return ticketDate >= weekAgo;
        case 'MONTH':
            return ticketDate >= monthAgo;
        default:
            return true;
    }
}

// Модальное окно подтверждения удаления
function showDeleteModal(requestId) {
    // Удаляем старое окно, если оно есть
    document.getElementById('delete-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'delete-modal';
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
            <p style="margin-bottom: 24px; color: #333;">Вы действительно хотите закрыть заявку <b>#${requestId}</b>?</p>
            <div style="display: flex; gap: 18px; justify-content: center;">
                <button id="delete-confirm" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Да, Закрыть</button>
                <button id="delete-cancel" style="background: #f3f3f3; color: #333; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Нет</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('delete-cancel').onclick = () => modal.remove();
    document.getElementById('delete-confirm').onclick = () => {
        modal.remove();
        deleteRequest(requestId);
    };
}

// Функция удаления заявки (заглушка)
async function deleteRequest(requestId) {
    // Здесь должен быть AJAX-запрос на удаление заявки
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
                showNotification(data.message, 'success');
                setTimeout(() => refreshTable(), 500);
            },
            error: function (error) {
                showNotification(`Заявка #${requestId} не удалена`, 'error');
                throw new Error("Ошибка при закрытии заявки");
            }
        });
    } catch (error) {
        console.error("Error:", error);
        showNotification("Ошибка", 'error');
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