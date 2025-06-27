// loadAllTickets.js — точка входа для главной страницы тикетов

export async function init() {
    // Импортируем функцию из tickets.js
    const { renderTicketsPage, updateTicketStats } = await import('./tickets.js');
    
    // Рендерим страницу тикетов
    await renderTicketsPage();
    
    // Обновляем статистику после полной загрузки
    await updateTicketStats();
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
                    window.location.href = '#request-id' + request.id;
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