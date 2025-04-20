document.addEventListener("DOMContentLoaded", function () {
    $.ajax({
        url: '/getRequestsOpen', // Путь к серверу
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

                // Кнопка редактирования
                let editBtn = document.createElement('button');
                editBtn.classList.add('edit-btn');
                editBtn.innerHTML = '<img src="/icon/edit.png" alt="Edit" width="20" height="20">'; // Замените на вашу картинку редактирования
                editBtn.addEventListener('click', function() {
                    window.location.href = '/editRequest/' + request.id; // Переход на страницу редактирования с передачей id
                });
                row.appendChild(editBtn);

                // Добавляем строку в таблицу
                tableBody.appendChild(row);
            });
        },
        error: function(xhr, status, error) {
            console.error("Ошибка при загрузке данных: ", error);
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("input[name='title']");

    searchInput.addEventListener("input", function () {
        const filter = searchInput.value.trim().toLowerCase();
        const rows = document.querySelectorAll("table tbody tr");

        rows.forEach(row => {
            const temaCell = row.querySelector("td:nth-child(4)"); // 4-й столбец — "Тема"
            const userCell = row.querySelector("td:nth-child(6)"); // 6-й столбец — "От"

            if (temaCell && userCell) {
                const temaText = temaCell.textContent.toLowerCase();
                const userText = userCell.textContent.toLowerCase();

                // Показываем строку, если хотя бы одно поле содержит фильтр
                row.style.display = temaText.includes(filter) || userText.includes(filter) ? "" : "none";
            }
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector("table");
    const headers = table.querySelectorAll("th");
    let sortOrder = {}; // Объект для хранения направления сортировки

    headers.forEach((header, columnIndex) => {
        header.style.cursor = "pointer"; // Делаем курсор указателем для удобства
        header.addEventListener("click", function () {
            const tbody = table.querySelector("tbody");
            const rows = Array.from(tbody.querySelectorAll("tr"));

            // Определяем текущий порядок сортировки (по возрастанию или убыванию)
            sortOrder[columnIndex] = !sortOrder[columnIndex];

            rows.sort((rowA, rowB) => {
                const cellA = rowA.children[columnIndex].textContent.trim();
                const cellB = rowB.children[columnIndex].textContent.trim();

                // Проверяем, числовые ли данные (для правильной сортировки чисел)
                const isNumeric = !isNaN(cellA) && !isNaN(cellB);
                if (isNumeric) {
                    return sortOrder[columnIndex] ? cellA - cellB : cellB - cellA;
                }

                return sortOrder[columnIndex] ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
            });

            // Обновляем таблицу с отсортированными строками
            tbody.innerHTML = "";
            rows.forEach(row => tbody.appendChild(row));
        });
    });
});