export function init() {
    refreshTable(); // вызывается при загрузке страницы
}

export function refreshTable() {
    $.ajax({
        url: '/getUsers', // Путь к серверу
        method: 'GET',
        success: function(data) {
            let tableBody = document.querySelector("#usersTable tbody");
            tableBody.innerHTML = ''; // Очищаем таблицу перед добавлением новых строк
            console.log(data);

            data.forEach(function(user) {
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
                cellGender.textContent = user.gender;
                row.appendChild(cellGender);

                let cellRole = document.createElement('td');
                cellRole.textContent = user.role;
                row.appendChild(cellRole);

                let cellActions = document.createElement('td');
                cellActions.className = 'edit';
                let actionDiv = document.createElement('div');
                actionDiv.className = 'action-buttons';

                // Кнопка редактировать
                let editBtn = document.createElement('button');
                editBtn.className = 'action-btn edit';
                editBtn.title = 'Редактировать';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.addEventListener('click', function () {
                    window.location.href = '/editUser/' + user.id;
                });
                actionDiv.appendChild(editBtn);

                // Кнопка удалить
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
        },
        error: function (xhr, status, error) {
            console.error("Ошибка при загрузке данных: ", error);
        }
    });
}
