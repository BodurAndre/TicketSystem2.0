// Инициализация страницы статистики
window.initStatistics = async function() {
    try {
        await loadStatistics();
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        showNotification('Ошибка загрузки статистики', 'error');
    }
};

// Загрузка статистических данных
async function loadStatistics() {
    // Загружаем данные о тикетах
    const ticketsResponse = await fetch('/api/requests');
    if (!ticketsResponse.ok) throw new Error('Ошибка загрузки тикетов');
    const tickets = await ticketsResponse.json();

    // Загружаем данные о пользователях
    const usersResponse = await fetch('/api/users');
    if (!usersResponse.ok) throw new Error('Ошибка загрузки пользователей');
    const users = await usersResponse.json();

    // Обновляем статистику
    updateStatistics(tickets, users);
}

// Обновление статистики на странице
function updateStatistics(tickets, users) {
    // Общие статистики
    document.getElementById('total-tickets').textContent = tickets.length;
    document.getElementById('total-users').textContent = users.length;
    
    // Статистика по статусам
    const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
    const closedTickets = tickets.filter(ticket => ticket.status === 'closed').length;
    
    document.getElementById('open-tickets').textContent = openTickets;
    document.getElementById('closed-tickets').textContent = closedTickets;
    
    // Статистика по приоритетам
    const lowPriority = tickets.filter(ticket => ticket.priority === 'low').length;
    const mediumPriority = tickets.filter(ticket => ticket.priority === 'medium').length;
    const highPriority = tickets.filter(ticket => ticket.priority === 'high').length;
    
    document.getElementById('low-priority').textContent = lowPriority;
    document.getElementById('medium-priority').textContent = mediumPriority;
    document.getElementById('high-priority').textContent = highPriority;
    
    // Последние активности
    updateRecentActivities(tickets);
}

// Обновление последних активностей
function updateRecentActivities(tickets) {
    const activitiesContainer = document.getElementById('recent-activities');
    
    // Сортируем тикеты по дате создания (новые сначала)
    const recentTickets = tickets
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    if (recentTickets.length === 0) {
        activitiesContainer.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <span>Нет активностей</span>
            </div>
        `;
        return;
    }
    
    const activitiesHTML = recentTickets.map(ticket => {
        const date = new Date(ticket.createdAt).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusIcon = ticket.status === 'open' ? 'fas fa-clock' : 'fas fa-check-circle';
        const statusColor = ticket.status === 'open' ? '#ffc107' : '#28a745';
        
        return `
            <div class="activity-item">
                <i class="fas fa-ticket-alt" style="color: #667eea;"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: #333;">${ticket.tema}</div>
                    <div style="font-size: 0.85em; color: #666;">Создан ${date}</div>
                </div>
                <i class="${statusIcon}" style="color: ${statusColor};"></i>
            </div>
        `;
    }).join('');
    
    activitiesContainer.innerHTML = activitiesHTML;
} 