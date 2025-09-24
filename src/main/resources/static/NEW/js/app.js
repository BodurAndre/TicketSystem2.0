window.addEventListener('DOMContentLoaded', route);
window.addEventListener('hashchange', route);

function route() {
    const hash = window.location.hash.slice(1) || 'loadAllTickets';
    if (hash === 'users') {
        loadPageUsers();
    } else if (hash === 'createUser') {
        loadPageCreateUser();
    } else if (hash === 'createTickets') {
        loadPage('createTickets');
    } else if (hash.startsWith('request-id')) {
        const id = hash.replace('request-id', '');
        loadPage('editRequest', id);
    } else if (hash === 'closed') {
        import('/NEW/js/tickets.js').then(module => module.renderClosedTicketsPage());
    } else if (hash === 'loadAllTickets' || hash === '#' || hash === '') {
        loadPageHome();
    } else if (hash === 'MyAccount') {
        loadPageMyAccount();
    } else if (hash === 'statistics') {
        loadPageStatistics();
    } else if (hash === 'chat') {
        loadPageChat();
    } else {
        loadPage(hash);
    }
}

// Функция для загрузки CSS файла
async function loadCSS(cssPath) {
    return new Promise((resolve, reject) => {
        // Удаляем все ранее подключённые page-specific CSS
        document.querySelectorAll('link[data-page-css]').forEach(link => link.remove());

        // Проверяем, не загружен ли уже этот CSS (на случай быстрой навигации)
        const existingLink = document.querySelector(`link[href="${cssPath}"]`);
        if (existingLink) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        link.setAttribute('data-page-css', 'true');
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));
        document.head.appendChild(link);
    });
}

async function loadPage(pageName, id = null) {
    const containerApp = document.getElementById('app');
    const containerInformation = document.getElementById('information');

    try {
        const htmlApp = await fetch(`/NEW/html/${pageName}.html`).then(r => r.text());
        const htmlInfo = await fetch(`/NEW/html/ticketInformation.html`).then(r => r.text());

        containerApp.innerHTML = htmlApp;
        if (containerInformation) {
            containerInformation.innerHTML = htmlInfo;
        }

        // Загружаем CSS файл для страницы
        await loadCSS(`/NEW/css/${pageName}.css`);

        const scriptModule = await import(`/NEW/js/${pageName}.js?${Date.now()}`);
        if (scriptModule.init) {
            scriptModule.init(id);
        }
    } catch (err) {
        containerApp.innerHTML = `<h2>Ошибка загрузки страницы</h2>`;
        if (containerInformation) {
            containerInformation.innerHTML = `<h2>Ошибка загрузки информации</h2>`;
        }
        console.error(err);
    }
}

async function loadPageUsers() {
    const containerApp = document.getElementById('app');
    const containerInformation = document.getElementById('information');

    try {
        // Загружаем HTML-шаблоны
        const htmlApp = await fetch(`/NEW/html/loadAllUsers.html`).then(r => r.text());
        const htmlInfo = await fetch(`/NEW/html/userInformation.html`).then(r => r.text());

        // Вставляем их в соответствующие контейнеры
        containerApp.innerHTML = htmlApp;
        if (containerInformation) {
            containerInformation.innerHTML = htmlInfo;
        }

        // Загружаем CSS файл
        await loadCSS('/NEW/css/loadAllUsers.css');

        // Импортируем JS-модуль и вызываем init
        const scriptModule = await import(`/NEW/js/loadAllUsers.js?${Date.now()}`);
        if (scriptModule.init) {
            scriptModule.init();
        }

    } catch (err) {
        containerApp.innerHTML = `<h2>Ошибка загрузки страницы</h2>`;
        if (containerInformation) {
            containerInformation.innerHTML = `<h2>Ошибка загрузки информации</h2>`;
        }
        console.error(err);
    }
}

async function loadPageHome() {
    const containerApp = document.getElementById('app');
    const containerInformation = document.getElementById('information');

    try {
        // Загружаем HTML-шаблоны
        const htmlApp = await fetch(`/NEW/html/loadAllTickets.html`).then(r => r.text());
        const htmlInfo = await fetch(`/NEW/html/ticketInformation.html`).then(r => r.text());

        // Вставляем их в соответствующие контейнеры
        containerApp.innerHTML = htmlApp;
        if (containerInformation) {
            containerInformation.innerHTML = htmlInfo;
        }

        // Загружаем CSS файл
        await loadCSS('/NEW/css/loadAllTickets.css');

        // Импортируем JS-модуль и вызываем init
        const scriptModule = await import(`/NEW/js/loadAllTickets.js?${Date.now()}`);
        if (scriptModule.init) {
            scriptModule.init();
        }

    } catch (err) {
        containerApp.innerHTML = `<h2>Ошибка загрузки страницы</h2>`;
        if (containerInformation) {
            containerInformation.innerHTML = `<h2>Ошибка загрузки информации</h2>`;
        }
        console.error(err);
    }
}

async function loadPageMyAccount() {
    const containerApp = document.getElementById('app');
    try {
        const htmlApp = await fetch(`/NEW/html/MyAccount.html`).then(r => r.text());
        containerApp.innerHTML = htmlApp;
        
        // Загружаем CSS файл
        await loadCSS('/NEW/css/MyAccount.css');
        
        // Импортируем JS-модуль, если потребуется, или инициализируем здесь:
        if (window.initMyAccount) {
            window.initMyAccount();
        }
    } catch (err) {
        containerApp.innerHTML = `<h2>Ошибка загрузки страницы</h2>`;
        console.error(err);
    }
}

async function loadPageCreateUser() {
    const containerApp = document.getElementById('app');
    const containerInformation = document.getElementById('information');

    try {
        // Загружаем HTML-шаблон
        const htmlApp = await fetch(`/NEW/html/createUser.html`).then(r => r.text());
        const htmlInfo = await fetch(`/NEW/html/userInformation.html`).then(r => r.text());

        // Вставляем их в соответствующие контейнеры
        containerApp.innerHTML = htmlApp;
        if (containerInformation) {
            containerInformation.innerHTML = htmlInfo;
        }

        // Загружаем CSS файл
        await loadCSS('/NEW/css/createUser.css');

        // Импортируем JS-модуль и вызываем init
        const scriptModule = await import(`/NEW/js/createUser.js?${Date.now()}`);
        if (scriptModule.init) {
            scriptModule.init();
        }

    } catch (err) {
        containerApp.innerHTML = `<h2>Ошибка загрузки страницы</h2>`;
        if (containerInformation) {
            containerInformation.innerHTML = `<h2>Ошибка загрузки информации</h2>`;
        }
        console.error(err);
    }
}

async function loadPageStatistics() {
    const containerApp = document.getElementById('app');
    try {
        const htmlApp = await fetch(`/NEW/html/statistics.html`).then(r => r.text());
        containerApp.innerHTML = htmlApp;
        
        // Загружаем CSS файл
        await loadCSS('/NEW/css/statistics.css');
        
        // Загружаем JavaScript файл и вызываем инициализацию
        const scriptModule = await import(`/NEW/js/statistics.js?${Date.now()}`);
        if (window.initStatistics) {
            window.initStatistics();
        }
    } catch (err) {
        containerApp.innerHTML = `<h2>Ошибка загрузки страницы статистики</h2>`;
        console.error(err);
    }
}

function setActiveNav() {
    const hash = window.location.hash;
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if ((hash === '' || hash === '#' || hash === '#loadAllTickets') && link.getAttribute('href') === '#') {
            link.classList.add('active');
        }
        if (hash === '#createTickets' && link.getAttribute('href') === '#createTickets') {
            link.classList.add('active');
        }
        if (hash === '#createUser' && link.getAttribute('href') === '#createUser') {
            link.classList.add('active');
        }
        if (hash === '#users' && link.getAttribute('href') === '#users') {
            link.classList.add('active');
        }
        if (hash === '#MyAccount' && link.getAttribute('href') === '#MyAccount') {
            link.classList.add('active');
        }
        if (hash === '#statistics' && link.getAttribute('href') === '#statistics') {
            link.classList.add('active');
        }
        // Добавь аналогично для других вкладок, если появятся
    });
}

window.addEventListener('hashchange', setActiveNav);
window.addEventListener('DOMContentLoaded', setActiveNav);

window.initMyAccount = async function() {
    const personalBtn = document.getElementById('account-personal-btn');
    const passwordBtn = document.getElementById('account-password-btn');
    const content = document.getElementById('account-content');

    function setActive(btn) {
        document.querySelectorAll('.account-menu-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    personalBtn.onclick = async function() {
        setActive(personalBtn);
        content.innerHTML = '<div style="text-align:center;color:#888;">Загрузка...</div>';
        try {
            const resp = await fetch('/getCurrentUser');
            if (!resp.ok) throw new Error('Ошибка загрузки данных');
            const user = await resp.json();
            content.innerHTML = `
                <div style="max-width:600px;margin:0 auto;">
                    <h2 style="text-align:center;margin-bottom:32px;color:#333;font-weight:600;">Мои данные</h2>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;" class="account-cards-grid">
                        <div class="account-card">
                            <div class="account-card-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="account-card-content">
                                <div class="account-label">Email</div>
                                <div class="account-value">${user.email || 'Не указан'}</div>
                            </div>
                        </div>
                        <div class="account-card">
                            <div class="account-card-icon">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="account-card-content">
                                <div class="account-label">Имя</div>
                                <div class="account-value">${user.firstName || 'Не указано'}</div>
                            </div>
                        </div>
                        <div class="account-card">
                            <div class="account-card-icon">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div class="account-card-content">
                                <div class="account-label">Фамилия</div>
                                <div class="account-value">${user.lastName || 'Не указана'}</div>
                            </div>
                        </div>
                        <div class="account-card">
                            <div class="account-card-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="account-card-content">
                                <div class="account-label">Роль</div>
                                <div class="account-value">${user.role || 'Не указана'}</div>
                            </div>
                        </div>
                        <div class="account-card">
                            <div class="account-card-icon">
                                <i class="fas fa-venus-mars"></i>
                            </div>
                            <div class="account-card-content">
                                <div class="account-label">Пол</div>
                                <div class="account-value">${user.gender || 'Не указан'}</div>
                            </div>
                        </div>
                        <div class="account-card">
                            <div class="account-card-icon">
                                <i class="fas fa-birthday-cake"></i>
                            </div>
                            <div class="account-card-content">
                                <div class="account-label">Дата рождения</div>
                                <div class="account-value">${user.dateOfBirth || 'Не указана'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            content.innerHTML = '<div style="color:red;text-align:center;">Ошибка загрузки данных</div>';
        }
    };

    passwordBtn.onclick = function() {
        setActive(passwordBtn);
        content.innerHTML = `
            <form style="max-width:400px;margin:0 auto;">
                <div class="account-label">Старый пароль</div>
                <input type="password" class="account-value" style="width:100%;margin-bottom:16px;" disabled placeholder="Пока недоступно">
                <div class="account-label">Новый пароль</div>
                <input type="password" class="account-value" style="width:100%;margin-bottom:16px;" disabled placeholder="Пока недоступно">
                <div class="account-label">Повторите новый пароль</div>
                <input type="password" class="account-value" style="width:100%;margin-bottom:24px;" disabled placeholder="Пока недоступно">
                <button type="button" class="modal-btn" style="width:100%;background:linear-gradient(135deg,#667eea,#764ba2);" disabled>Сохранить</button>
            </form>
            <div style="color:#888;text-align:center;margin-top:12px;">Изменение пароля будет доступно позже</div>
        `;
    };

    // По умолчанию показываем персональные данные
    personalBtn.click();
};

// Функция загрузки страницы чата
async function loadPageChat() {
    try {
        // Загружаем CSS для чата
        await loadCSS('/NEW/css/chat.css');
        
        // Загружаем HTML чата
        const response = await fetch('/NEW/html/chat.html');
        const html = await response.text();
        
        // Вставляем HTML в контейнер приложения
        const app = document.getElementById('app');
        app.innerHTML = html;
        
        // Загружаем JavaScript для чата
        const script = document.createElement('script');
        script.src = '/NEW/js/chat.js';
        script.onload = () => {
            console.log('Chat script loaded successfully');
            console.log('📊 document.readyState после загрузки скрипта:', document.readyState);
        };
        script.onerror = (error) => {
            console.error('❌ Ошибка загрузки скрипта chat.js:', error);
        };
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
        document.getElementById('app').innerHTML = '<div style="color:red;text-align:center;">Ошибка загрузки чата</div>';
    }
}