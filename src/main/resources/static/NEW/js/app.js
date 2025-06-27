window.addEventListener('DOMContentLoaded', route);
window.addEventListener('hashchange', route);

function route() {
    const page = window.location.hash.slice(1) || 'loadAllTickets';
    console.log(page);
    if(page === 'users') loadPageUsers();
    else loadPage(page);
}

async function loadPage(pageName) {
    const container = document.getElementById('app');
    try {
        const html = await fetch(`/NEW/html/${pageName}.html`).then(r => r.text());
        container.innerHTML = html;

        const scriptModule = await import(`/NEW/js/${pageName}.js`);
        if (scriptModule.init) scriptModule.init(); // вызываем init() если есть
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