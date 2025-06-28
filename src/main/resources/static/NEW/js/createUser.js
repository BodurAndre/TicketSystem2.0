// Делаем функцию closeModal глобально доступной
window.closeModal = function() {
    document.getElementById('userModal').classList.remove('active');

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


// --- Валидация формы ---
function validateUserForm() {
    const email = document.getElementById('email').value.trim();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();

    if (!firstName) {
        showNotification('Введите имя', 'error');
        return false;
    }
    if (!lastName) {
        showNotification('Введите фамилию', 'error');
        return false;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        showNotification('Введите корректный email', 'error');
        return false;
    }
    return true;
}

// --- Обработка кнопки создания пользователя ---
const createUserBtn = document.getElementById('create-user');
if (createUserBtn) {
  createUserBtn.onclick = async function() {
    if (!validateUserForm()) return;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;
    const dateOfBirth = document.getElementById('dateOfBirth').value;
    const gender = document.querySelector('input[name="gender"]:checked');

    const data = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: role,
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
  }
}

function showModal(email, password) {
    document.getElementById('modal-email').textContent = email;
    document.getElementById('modal-password').textContent = password;
    document.getElementById('userModal').classList.add('active');
    
    // Добавляем обработчик клика вне модального окна
    document.getElementById('userModal').addEventListener('click', function(e) {
        if (e.target === this) {
            window.closeModal();
        }
    });
    
    // Добавляем обработчик клавиши Escape
    document.addEventListener('keydown', function escListener(e) {
        if (e.key === 'Escape') {
            window.closeModal();
            document.removeEventListener('keydown', escListener);
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