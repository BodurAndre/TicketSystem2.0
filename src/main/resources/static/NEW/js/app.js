window.addEventListener('DOMContentLoaded', route);
window.addEventListener('hashchange', route);

function route() {
    const hash = window.location.hash.slice(1) || 'loadAllTickets';
    if (hash === 'users') {
        loadPageUsers();
    } else if (hash.startsWith('request-id')) {
        const id = hash.replace('request-id', '');
        loadPage('editRequest', id);
    } else {
        loadPage(hash);
    }
}


async function loadPage(pageName, id = null) {
    const container = document.getElementById('app');
    try {
        const html = await fetch(`/NEW/html/${pageName}.html`).then(r => r.text());
        container.innerHTML = html;

        const scriptModule = await import(`/NEW/js/${pageName}.js?${Date.now()}`);
        if (scriptModule.init) {
            scriptModule.init(id); // передаем id если есть
        }
    } catch (err) {
        container.innerHTML = `<h2>Ошибка загрузки страницы</h2>`;
        console.error(err);
    }
}


async function loadPageUsers() {
    const container = document.getElementById('app');
    console.log();
    try {
        const html = await fetch(`/NEW/html/loadAllUsers.html`).then(r => r.text());
        container.innerHTML = html;

        const scriptModule = await import(`/NEW/js/loadAllUsers.js`);
        if (scriptModule.init) scriptModule.init(); // вызываем init() если есть
    } catch (err) {
        container.innerHTML = `<h2>Ошибка загрузки страницы</h2>`;
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