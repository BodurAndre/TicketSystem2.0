// Делаем функцию closeModal глобально доступной
window.closeModal = function() {
    document.getElementById('userModal').style.display = 'none';

    // Очистка всех полей формы
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('role').value = '';
    document.getElementById('country').value = '';
    document.getElementById('dateOfBirth').value = '';

    // Снимаем выбор пола (если это radio buttons)
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    genderRadios.forEach(radio => radio.checked = false);

    // Перенаправление на страницу пользователей
    setTimeout(function() {
        window.location.hash = '#users';
    }, 300);
};

document.getElementById('create-user').addEventListener('click', async function () {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;
    const country = document.getElementById('country').value;
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const gender = document.querySelector('input[name="gender"]:checked');

    if (!firstName || !lastName || !email || !role || !country || !dateOfBirth || !gender) {
        alert("Пожалуйста, заполните все поля.");
        return;
    }

    const data = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: role,
        country: country,
        dateOfBirth: dateOfBirth,
        gender: gender.value
    };

    try {
        const csrf = await getCsrfToken();
        $.ajax({
            url: "/createUser",
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(data),
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: function (data) {
                console.log("Request close:", data);
                showNotification("Пользователь успешно создан!", 'success');
                showModal(data.email, data.password); // вызов модалки
            },
            error: function (error) {
                console.error("Error:", error);
                const message = error.responseJSON?.message || "Неизвестная ошибка";
                showNotification(message, 'error');
            }
        });
    } catch (error) {
        console.error("Error:", error);
        showNotification("Ошибка", 'error');
    }
});

function showModal(email, password) {
    document.getElementById('modal-email').textContent = email;
    document.getElementById('modal-password').textContent = password;
    document.getElementById('userModal').style.display = 'block';
    
    // Добавляем обработчик клика вне модального окна
    document.getElementById('userModal').addEventListener('click', function(e) {
        if (e.target === this) {
            window.closeModal();
        }
    });
    
    // Добавляем обработчик клавиши Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeModal();
        }
    });
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