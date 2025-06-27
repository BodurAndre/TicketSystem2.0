export function init() {
    refreshTable(); // вызывается при загрузке страницы
}

export function refreshTable() {
    $.ajax({
        url: '/requests', // Путь к серверу
        method: 'GET',
        success: function(data) {
            let tableBody = document.querySelector("table tbody");
            tableBody.innerHTML = ''; // Очищаем таблицу перед добавлением новых строк
            console.log(data);

            // Перебираем все запросы и добавляем их в таблицу
            data.forEach(function(request) {
                let row = document.createElement('tr');

                // ID
                let cellId = document.createElement('td');
                cellId.textContent = request.id;
                row.appendChild(cellId);

                // Дата
                let cellData = document.createElement('td');
                cellData.textContent = request.data; // Обратите внимание на правильное имя поля
                row.appendChild(cellData);  // Добавляем сюда cellData

                // Время
                let cellTime = document.createElement('td');
                cellTime.textContent = request.time; // Обратите внимание на правильное имя поля
                row.appendChild(cellTime);  // Добавляем сюда cellTime

                // Тема
                let cellTema = document.createElement('td');
                cellTema.textContent = request.tema;
                row.appendChild(cellTema);

                // Приоритет
                let cellPriority = document.createElement('td');
                cellPriority.textContent = request.priority;
                row.appendChild(cellPriority);

                // Пользователь
                let cellUser = document.createElement('td');
                if(request.createUser != null) {
                    const user = request.createUser; // Предполагаем, что request.user — это объект User
                    // Формируем строку в формате "firstName lastName (email)"
                    const userText = `${user.firstName} ${user.lastName} (${user.email})`;
                    cellUser.textContent = userText;
                }
                else {
                    const defaultText = "Пользователь не выбран";
                    cellUser.textContent = defaultText; // <-- правильно!
                }
                row.appendChild(cellUser);
                // Статус
                let cellStatus = document.createElement('td');
                cellStatus.textContent = request.status;
                row.appendChild(cellStatus);

                // Действие (редактировать/закрытие)
                let cellAction = document.createElement('td');
                cellAction.className = 'edit';
                let actionDiv = document.createElement('div');
                actionDiv.className = 'action-buttons';

                // Кнопка редактировать
                let editBtn = document.createElement('button');
                editBtn.className = 'action-btn edit';
                editBtn.title = 'Редактировать';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.location.href = '/editRequest/' + request.id;
                });
                actionDiv.appendChild(editBtn);

                // Кнопка Закрытие
                let deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-btn delete';
                deleteBtn.title = 'Закрыть';
                deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showDeleteModal(request.id);
                });
                actionDiv.appendChild(deleteBtn);

                cellAction.appendChild(actionDiv);
                row.appendChild(cellAction);

                // Добавляем строку в таблицу
                tableBody.appendChild(row);
            });
        },
        error: function(xhr, status, error) {
            console.error("Ошибка при загрузке данных: ", error);
        }
    });
}
