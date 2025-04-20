document.addEventListener("DOMContentLoaded", async function () {
    const urlParts = window.location.pathname.split("/");
    const id = urlParts[urlParts.length - 1];

    if (!isNaN(id)) {
        await loadUserData(id);
    } else {
        console.error("Некорректный ID в URL");
    }
});

// Функция загрузки данных заявки
async function loadUserData(id) {
    try {
        const response = await fetch(`/getUser/${id}`);
        if (!response.ok) throw new Error("Ошибка при загрузке данных");

        const data = await response.json();
        document.getElementById("firstName").value = data.firstName;
        document.getElementById("lastName").value = data.lastName;
        document.getElementById("email").value = data.email;
        document.getElementById("role").value = data.role;
        document.getElementById("country").value = data.country;
        document.getElementById("dateOfBirth").value = data.dateOfBirth;
        document.getElementById("gender").value = data.gender;

    } catch (error) {
        console.error("Ошибка при загрузке заявки:", error);
    }
}


document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("input[name='title']");

    searchInput.addEventListener("input", function () {
        const filter = searchInput.value.trim().toLowerCase();
        const rows = document.querySelectorAll("table tbody tr");

        rows.forEach(row => {
            const temaCell = row.querySelector("td:nth-child(2)"); // 4-й столбец — "Тема"
            const userCell = row.querySelector("td:nth-child(3)"); // 6-й столбец — "От"

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