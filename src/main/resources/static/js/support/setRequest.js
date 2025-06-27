$('#create-request-form').on('submit', async function (event) {
    event.preventDefault(); // Останавливаем стандартное отправление формы

    // Получаем CSRF-токен
    async function getCsrfToken() {
        return $.ajax({
            url: '/csrf-token',
            method: 'GET',
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                return { headerName: data.headerName, token: data.token };
            },
            error: function() {
                console.error('Error fetching CSRF token');
            }
        });
    }

    // Получаем значения из полей формы
    const tema = $('#tema').val();
    const priority = $('#priority').val();
    const description = $('#description').val();
    const userId = $('#select-user').val()

    // Получаем текущую дату и время
    const currentDate = new Date();
    const date = currentDate.toLocaleDateString();
    const time = currentDate.toLocaleTimeString();

    // Создаем объект с данными для отправки
    const requestData = {
        data: date,
        time: time,
        tema: tema,  // Устанавливаем пользователя как "USER"
        status: 'OPEN', // Статус = "OPEN"
        priority: priority,
        description: description,
        user: userId
    };

    try {
        // Получаем CSRF-токен
        const csrf = await getCsrfToken();

        // Отправляем запрос через $.ajax
        $.ajax({
            url: '/RequestCreate',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            headers: {
                [csrf.headerName]: csrf.token // Добавляем CSRF-токен
            },
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                console.log('Request created:', data);
                showNotification(data.message, 'success');
            },
            error: function(error) {
                console.error('Error:', error);
                showNotification("Code " + error.status + " : " + error.responseJSON.error, 'error');
            }
        });
    } catch (error) {
        console.error('Error:', error);
        showNotification('Ошибка', 'error');
    }
});
