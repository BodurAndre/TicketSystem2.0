// Современный JavaScript для тикет системы

document.addEventListener('DOMContentLoaded', function() {
    // Установка класса роли на body
    const role = localStorage.getItem('role');
    if (role === 'ROLE_ADMIN') {
        document.body.classList.add('show-admin', 'show-processor', 'show-user');
    } else if (role === 'ROLE_PROCESSOR') {
        document.body.classList.add('show-processor');
    } else if (role === 'ROLE_USER') {
        document.body.classList.add('show-user');
    }

    // Инициализация при загрузке страницы
    initializePage();
    
    // Настройка поиска
    setupSearch();
    
    // Настройка статистики
    updateStats();
});

function initializePage() {
    // Убираем прелоадер
    setTimeout(() => {
        document.body.classList.remove('loading');
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
        }
    }, 500);
    
    // Добавляем анимации для элементов
    animateElements();
}

function animateElements() {
    // Анимация появления элементов
    const elements = document.querySelectorAll('.nav-link, .stat-item, .table-container');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function setupSearch() {
    const searchInput = document.querySelector('.search-box input[type="text"]');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        // Поиск при нажатии Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Поиск при клике на кнопку
        searchBtn.addEventListener('click', performSearch);
        
        // Живой поиск с задержкой
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 500);
        });
    }
}

function performSearch() {
    const searchInput = document.querySelector('.search-box input[type="text"]');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    // Добавляем визуальную обратную связь
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        searchBtn.disabled = true;
    }
    
    // Здесь будет логика поиска
    console.log('Поиск:', searchTerm);
    
    // Имитация поиска
    setTimeout(() => {
        if (searchBtn) {
            searchBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
            searchBtn.disabled = false;
        }
        
        // Показываем уведомление о поиске
        showNotification(`Поиск по запросу: "${searchTerm}"`, 'info');
    }, 1000);
}

function updateStats() {
    // Обновление статистики
    const totalTickets = document.getElementById('total-tickets');
    const openTickets = document.getElementById('open-tickets');
    
    // Здесь будет загрузка реальной статистики
    if (totalTickets) {
        animateNumber(totalTickets, 0, 25, 1000);
    }
    
    if (openTickets) {
        animateNumber(openTickets, 0, 8, 1000);
    }
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function refreshTable() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
        refreshBtn.disabled = true;
    }
    
    // Имитация обновления
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить';
            refreshBtn.disabled = false;
        }
        
        showNotification('Таблица обновлена', 'success');
        
        // Перезагружаем данные
        if (typeof loadRequests === 'function') {
            loadRequests();
        }
    }, 1500);
}

function showNotification(message, type = 'info') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Добавляем стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Кнопка закрытия
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
    
    // Автоматическое закрытие
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        'success': 'linear-gradient(135deg, #27ae60, #2ecc71)',
        'error': 'linear-gradient(135deg, #e74c3c, #c0392b)',
        'warning': 'linear-gradient(135deg, #f39c12, #e67e22)',
        'info': 'linear-gradient(135deg, #3498db, #2980b9)'
    };
    return colors[type] || colors.info;
}

// Функция для форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Функция для форматирования времени
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Функция для получения класса приоритета
function getPriorityClass(priority) {
    const priorityMap = {
        'HIGH': 'priority-high',
        'MEDIUM': 'priority-medium',
        'LOW': 'priority-low'
    };
    return priorityMap[priority] || 'priority-medium';
}

// Функция для получения класса статуса
function getStatusClass(status) {
    const statusMap = {
        'OPEN': 'status-open',
        'CLOSED': 'status-closed',
        'PENDING': 'status-pending'
    };
    return statusMap[status] || 'status-open';
}

// Функция для создания строки таблицы
function createTableRow(ticket) {
    return `
        <tr>
            <td class="request">#${ticket.id}</td>
            <td class="date">${formatDate(ticket.date)}</td>
            <td class="time">${formatTime(ticket.date)}</td>
            <td class="tema">${ticket.title}</td>
            <td class="priority">
                <span class="priority-badge ${getPriorityClass(ticket.priority)}">
                    ${ticket.priority}
                </span>
            </td>
            <td class="from">${ticket.userName}</td>
            <td class="status">
                <span class="status-badge ${getStatusClass(ticket.status)}">
                    ${ticket.status}
                </span>
            </td>
            <td class="edit">
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editTicket(${ticket.id})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTicket(${ticket.id})" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Функции для работы с тикетами
function editTicket(id) {
    showNotification(`Редактирование тикета #${id}`, 'info');
    // Здесь будет логика редактирования
}

function deleteTicket(id) {
    if (confirm(`Вы уверены, что хотите удалить тикет #${id}?`)) {
        showNotification(`Тикет #${id} удален`, 'success');
        // Здесь будет логика удаления
    }
}

// Экспортируем функции для использования в других файлах
window.refreshTable = refreshTable;
window.editTicket = editTicket;
window.deleteTicket = deleteTicket;
window.createTableRow = createTableRow;
window.showNotification = showNotification;
