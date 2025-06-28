let allUsers = [];
let userSort = { field: null, asc: true };
let userFilters = { search: '', role: 'ALL', gender: 'ALL' };

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
        deleteBtn.addEventListener('click', function () {
            if (confirm(`Вы уверены, что хотите удалить пользователя #${user.id}?`)) {
                deleteUser(user.id);
            }
        });
        actionDiv.appendChild(deleteBtn);
        
        cellActions.appendChild(actionDiv);
        row.appendChild(cellActions);
        tableBody.appendChild(row);
    });
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;">Нет пользователей</td></tr>';
    }
}

function deleteUser(userId) {
    $.ajax({
        url: '/deleteUser/' + userId,
        method: 'DELETE',
        success: function(response) {
            console.log('Пользователь успешно удален');
            refreshTable(); // Обновляем таблицу после удаления
        },
        error: function(xhr, status, error) {
            console.error("Ошибка при удалении пользователя: ", error);
            alert('Ошибка при удалении пользователя');
        }
    });
}
