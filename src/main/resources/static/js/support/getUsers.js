document.addEventListener("DOMContentLoaded", function () {
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

                let editBtn = document.createElement('button');
                editBtn.classList.add('edit-btn');
                editBtn.innerHTML = '<img src="/icon/edit.png" alt="Edit" width="20" height="20">';
                editBtn.addEventListener('click', function () {
                    window.location.href = '/editUser/' + user.id;
                });
                row.appendChild(editBtn);

                tableBody.appendChild(row);
            });
        },
        error: function (xhr, status, error) {
            console.error("Ошибка при загрузке данных: ", error);
        }
    });
});

// Фильтрация по Email, Имени, Фамилии
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("input[name='title']");
    searchInput.addEventListener("input", function () {
        const filter = searchInput.value.trim().toLowerCase();
        const rows = document.querySelectorAll("#usersTable tbody tr");

        rows.forEach(row => {
            const idCell = row.querySelector("td:nth-child(1)");
            const emailCell = row.querySelector("td:nth-child(2)");
            const firstNameCell = row.querySelector("td:nth-child(3)");
            const lastNameCell = row.querySelector("td:nth-child(4)");

            if (emailCell && firstNameCell && lastNameCell && idCell) {

                const idText = idCell.textContent.toLowerCase();
                const emailText = emailCell.textContent.toLowerCase();
                const firstNameText = firstNameCell.textContent.toLowerCase();
                const lastNameText = lastNameCell.textContent.toLowerCase();

                row.style.display = emailText.includes(filter) || firstNameText.includes(filter) || lastNameText.includes(filter) || idText.includes(filter) ? "" : "none";
            }
        });
    });
});

// Сортировка таблицы
document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector("#usersTable");
    const headers = table.querySelectorAll("th");
    let sortOrder = {}; // Объект для хранения направления сортировки

    headers.forEach((header, columnIndex) => {
        header.style.cursor = "pointer";
        header.addEventListener("click", function () {
            const tbody = table.querySelector("tbody");
            const rows = Array.from(tbody.querySelectorAll("tr"));

            sortOrder[columnIndex] = !sortOrder[columnIndex];

            rows.sort((rowA, rowB) => {
                const cellA = rowA.children[columnIndex].textContent.trim();
                const cellB = rowB.children[columnIndex].textContent.trim();

                const isNumeric = !isNaN(cellA) && !isNaN(cellB);
                if (isNumeric) {
                    return sortOrder[columnIndex] ? cellA - cellB : cellB - cellA;
                }
                return sortOrder[columnIndex] ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
            });

            tbody.innerHTML = "";
            rows.forEach(row => tbody.appendChild(row));
        });
    });
});