let allUsers = [];
let userSort = { field: null, asc: true };
let userFilters = { search: '', role: 'ALL', gender: 'ALL' };
let userToDelete = null;

export function init() {
    refreshTable();
    // Навешиваем обработчики после загрузки таблицы
    setTimeout(() => {
        // Используем глобальный поиск
        const globalSearch = document.querySelector('input[name="title"]');
        if (globalSearch) globalSearch.oninput = (e) => { userFilters.search = e.target.value; renderFilteredUsers(); };
        const role = document.getElementById('filter-role');
        if (role) role.onchange = (e) => { userFilters.role = e.target.value; renderFilteredUsers(); };
        const gender = document.getElementById('filter-gender');
        if (gender) gender.onchange = (e) => { userFilters.gender = e.target.value; renderFilteredUsers(); };
        document.querySelectorAll('.modern-table th[data-sort]').forEach(th => {
            th.style.cursor = 'pointer';
            th.onclick = () => {
                const field = th.getAttribute('data-sort');
                if (userSort.field === field) {
                    userSort.asc = !userSort.asc;
                } else {
                    userSort.field = field;
                    userSort.asc = true;
                }
                renderFilteredUsers();
            };
        });
    }, 100);
}

export function refreshTable() {
    $.ajax({
        url: '/getUsers',
        method: 'GET',
        success: function(data) {
            allUsers = data;
            renderFilteredUsers();
        },
        error: function (xhr, status, error) {
            console.error("Ошибка при загрузке данных: ", error);
        }
    });
}

function renderFilteredUsers() {
    let filtered = allUsers.filter(user => {
        const search = userFilters.search.trim().toLowerCase();
        let match = true;
        if (search) {
            match = (
                (user.email && user.email.toLowerCase().includes(search)) ||
                (user.firstName && user.firstName.toLowerCase().includes(search)) ||
                (user.lastName && user.lastName.toLowerCase().includes(search))
            );
        }
        if (userFilters.role !== 'ALL' && String(user.role).toUpperCase() !== userFilters.role) return false;
        if (userFilters.gender !== 'ALL' && String(user.gender).toUpperCase() !== userFilters.gender) return false;
        return match;
    });
    // Сортировка
    if (userSort.field) {
        filtered.sort((a, b) => {
            let v1 = a[userSort.field];
            let v2 = b[userSort.field];
            if (typeof v1 === 'string') v1 = v1.toLowerCase();
            if (typeof v2 === 'string') v2 = v2.toLowerCase();
            if (v1 < v2) return userSort.asc ? -1 : 1;
            if (v1 > v2) return userSort.asc ? 1 : -1;
            return 0;
        });
    }
    // Стилизация стрелок сортировки
    document.querySelectorAll('.sort-arrow').forEach(el => el.innerHTML = '');
    if (userSort.field) {
        const arrow = document.getElementById('sort-' + userSort.field);
        if (arrow) {
            arrow.innerHTML = userSort.asc ? '<i class="fas fa-chevron-up" style="color:#3498db;font-size:0.9em;"></i>' : '<i class="fas fa-chevron-down" style="color:#3498db;font-size:0.9em;"></i>';
        }
    }
    let tableBody = document.querySelector("#usersTable tbody");
    tableBody.innerHTML = '';
    filtered.forEach(function(user) {
        let row = document.createElement('tr');
        
        let cellId = document.createElement('td');
        cellId.textContent = user.id;
        row.appendChild(cellId);
        
        let cellEmail = document.createElement('td');
        cellEmail.textContent = user.email;
        row.appendChild(cellEmail);
        
        let cellFirstName = document.createElement('td');
        cellFirstName.textContent = user.firstName;
        row.appendChild(cellFirstName);
        
        let cellLastName = document.createElement('td');
        cellLastName.textContent = user.lastName;
        row.appendChild(cellLastName);
        
        let cellGender = document.createElement('td');
        cellGender.innerHTML = `<span class="gender-badge gender-${user.gender.toLowerCase()}">${user.gender}</span>`;
        row.appendChild(cellGender);
        
        let cellRole = document.createElement('td');
        cellRole.innerHTML = `<span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span>`;
        row.appendChild(cellRole);
        
        let cellActions = document.createElement('td');
        cellActions.className = 'edit';
        let actionDiv = document.createElement('div');
        actionDiv.className = 'action-buttons';
        
        let editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit';
        editBtn.title = 'Редактировать';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', function () {
            window.location.href = '/editUser/' + user.id;
        });
        actionDiv.appendChild(editBtn);
        
        let deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete';
        deleteBtn.title = 'Удалить';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => window.showDeleteUserModal(user);
        actionDiv.appendChild(deleteBtn);
        
        cellActions.appendChild(actionDiv);
        row.appendChild(cellActions);
        tableBody.appendChild(row);
    });
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;">Нет пользователей</td></tr>';
    }
}

window.showDeleteUserModal = function(user) {
    document.getElementById('delete-user-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'delete-user-modal';
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
            <h3 style="margin-bottom: 18px; color: #e74c3c;"><i class='fas fa-user-times'></i> Подтвердите удаление</h3>
            <p style="margin-bottom: 24px; color: #333;">Вы действительно хотите удалить пользователя <b>${user.email}</b>?</p>
            <div style="display: flex; gap: 18px; justify-content: center;">
                <button id="user-delete-confirm" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Да, Удалить</button>
                <button id="user-delete-cancel" style="background: #f3f3f3; color: #333; border: none; border-radius: 8px; padding: 10px 24px; font-size: 1em; cursor: pointer;">Нет</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('user-delete-cancel').onclick = () => modal.remove();
    document.getElementById('user-delete-confirm').onclick = async () => {
        modal.remove();
        await deleteUser(user.id);
    };
};

async function deleteUser(userId) {
    try {
        const csrf = await getCsrfToken();
        $.ajax({
            url: '/deleteUser/' + userId,
            method: "DELETE",
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: function (data) {
                showNotification(JSON.parse(data.message || '{"message":"Пользователь удалён"}').message, true);
                refreshTable();
            },
            error: function (error) {
                showNotification("Code " + error.status + " : " + (error.responseJSON?.message || "Ошибка удаления"), false);
            }
        });
    } catch (error) {
        showNotification('Ошибка при удалении пользователя', 'error');
        console.error('Ошибка при удалении пользователя: ', error);
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
