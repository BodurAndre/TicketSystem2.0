// Инициализация страницы создания тикетов
export function init() {
    console.log('Инициализация страницы создания тикетов...');
    
    // Добавляем кнопку для инициализации данных (временно для тестирования)
    addInitDataButton();
    
    // Тестируем API
    testAPI();
    
    loadCompanies();
    setupFormHandlers();
    console.log('Инициализация завершена');
}

// Добавление кнопки для инициализации данных
function addInitDataButton() {
    const form = document.querySelector('.form');
    if (form) {
        const initButton = document.createElement('button');
        initButton.type = 'button';
        initButton.textContent = 'Инициализировать данные';
        initButton.style.cssText = `
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            cursor: pointer;
        `;
        initButton.onclick = initializeData;
        form.insertBefore(initButton, form.firstChild);
    }
}

// Получение CSRF токена
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

// Функция инициализации данных
async function initializeData() {
    try {
        console.log('Инициализируем данные...');
        const csrf = await getCsrfToken();
        
        $.ajax({
            url: "/api/init-data",
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify({}),
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: function(data) {
                console.log('Результат инициализации:', data);
                showNotification(data.message, 'success');
                
                // Перезагружаем компании после инициализации
                setTimeout(() => {
                    loadCompanies();
                }, 1000);
            },
            error: function(error) {
                console.error("Error:", error);
                showNotification("Code " + error.status + " : " + error.responseJSON?.error, 'error');
            }
        });
        
    } catch (error) {
        console.error('Ошибка инициализации данных:', error);
        showNotification('Ошибка инициализации данных: ' + error.message, 'error');
    }
}

// Загрузка списка компаний
async function loadCompanies() {
    try {
        console.log('Загружаем компании...');
        const response = await fetch('/api/companies');
        console.log('Ответ от сервера:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка ответа:', errorText);
            throw new Error(`Ошибка загрузки компаний: ${response.status} ${response.statusText}`);
        }
        
        const companies = await response.json();
        console.log('Полученные компании:', companies);
        
        const companySelect = document.getElementById('select-company');
        if (!companySelect) {
            console.error('Элемент select-company не найден');
            return;
        }
        
        // Очищаем существующие опции
        companySelect.innerHTML = '<option value="" disabled selected>Выберите компанию</option>';
        
        // Добавляем компании
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            companySelect.appendChild(option);
        });
        
        console.log('Компании загружены успешно');
    } catch (error) {
        console.error('Ошибка загрузки компаний:', error);
        showNotification('Ошибка загрузки списка компаний: ' + error.message, 'error');
    }
}

// Загрузка серверов по выбранной компании
async function loadServersByCompany(companyId) {
    try {
        console.log('Загружаем серверы для компании:', companyId);
        const response = await fetch(`/api/servers/${companyId}`);
        console.log('Ответ от сервера:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка ответа:', errorText);
            throw new Error(`Ошибка загрузки серверов: ${response.status} ${response.statusText}`);
        }
        
        const servers = await response.json();
        console.log('Полученные серверы:', servers);
        
        const serverSelect = document.getElementById('select-server');
        if (!serverSelect) {
            console.error('Элемент select-server не найден');
            return;
        }
        
        // Очищаем существующие опции
        serverSelect.innerHTML = '<option value="" disabled selected>Выберите сервер</option>';
        
        // Добавляем серверы
        servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            serverSelect.appendChild(option);
        });
        
        console.log('Серверы загружены успешно');
    } catch (error) {
        console.error('Ошибка загрузки серверов:', error);
        showNotification('Ошибка загрузки списка серверов: ' + error.message, 'error');
    }
}

// Настройка обработчиков событий
function setupFormHandlers() {
    // Обработчик изменения компании
    const companySelect = document.getElementById('select-company');
    companySelect.addEventListener('change', function() {
        const companyId = this.value;
        if (companyId) {
            loadServersByCompany(companyId);
        } else {
            // Сброс серверов если компания не выбрана
            const serverSelect = document.getElementById('select-server');
            serverSelect.innerHTML = '<option value="" disabled selected>Сначала выберите компанию</option>';
        }
    });

    // Обработчик отправки формы
    const form = document.getElementById('create-request-form');
    form.addEventListener('submit', handleFormSubmit);
}

// Обработка отправки формы
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const requestData = {
        data: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU'),
        tema: formData.get('tema'),
        priority: formData.get('priority'),
        companyId: parseInt(formData.get('companyId')),
        serverId: parseInt(formData.get('serverId')),
        contacts: formData.get('contacts'),
        description: formData.get('description'),
        status: 'OPEN'
    };

    try {
        const csrf = await getCsrfToken();
        
        $.ajax({
            url: '/RequestCreate',
            method: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            headers: { [csrf.headerName]: csrf.token },
            xhrFields: { withCredentials: true },
            success: function(data) {
                console.log('Request created:', data);
                showNotification(data.message, 'success');
                
                // Очищаем форму
                event.target.reset();
                document.getElementById('select-server').innerHTML = '<option value="" disabled selected>Сначала выберите компанию</option>';
                
                // Перенаправляем на страницу с заявками
                setTimeout(() => {
                    window.location.hash = 'loadAllTickets';
                }, 1500);
            },
            error: function(error) {
                console.error('Error:', error);
                showNotification("Code " + error.status + " : " + error.responseJSON?.error, 'error');
            }
        });
        
    } catch (error) {
        console.error('Ошибка создания заявки:', error);
        showNotification('Ошибка создания заявки: ' + error.message, 'error');
    }
}

// Тестирование API
async function testAPI() {
    try {
        console.log('Тестируем API...');
        const response = await fetch('/api/test');
        console.log('Тестовый ответ:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Тестовые данные:', data);
        } else {
            console.error('Тестовый API не работает');
        }
    } catch (error) {
        console.error('Ошибка тестирования API:', error);
    }
}
