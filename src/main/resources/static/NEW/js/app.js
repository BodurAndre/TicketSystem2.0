window.addEventListener('DOMContentLoaded', route);
window.addEventListener('hashchange', route);

function route() {
    const page = window.location.hash.slice(1) || 'loadAllTickets';
    loadPage(page);
}

async function loadPage(pageName) {
    const container = document.getElementById('app');
    console.log(pageName);
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

