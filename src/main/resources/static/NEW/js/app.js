window.addEventListener('DOMContentLoaded', route);
window.addEventListener('hashchange', route);

function route() {
    const hash = window.location.hash.slice(1) || 'loadAllTickets';
    if (hash === 'users') {
        loadPageUsers();
    } else if (hash.startsWith('request-id')) {
        const id = hash.replace('request-id', '');
        loadPage('editRequest', id);
    } else if (hash === 'closed') {
        import('/NEW/js/tickets.js').then(module => module.renderClosedTicketsPage());
    } else if (hash === 'loadAllTickets' || hash === '') {
        loadPage('loadAllTickets');
    } else {
        loadPage(hash);
    }
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


function setActiveNav() {
    const hash = window.location.hash;
    document.querySelectorAll('.nav-link').forEach(link => {
        console.log(hash);
        if (hash === '#createUser') {
            console.log("зашли в цикл")
            return}
        link.classList.remove('active');
        if ((hash === '' || hash === '#' || hash === '#loadAllTickets') && link.getAttribute('href') === '#') {
            link.classList.add('active');
        }
        if (hash === '#createTickets' && link.getAttribute('href') === '#createTickets') {
            link.classList.add('active');
        }
        if (hash === '#users' && link.getAttribute('href') === '#users') {
            link.classList.add('active');
        }
        // Добавь аналогично для других вкладок, если появятся
    });
}

window.addEventListener('hashchange', setActiveNav);
window.addEventListener('DOMContentLoaded', setActiveNav);