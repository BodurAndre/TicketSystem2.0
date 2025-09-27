// Обертка для предотвращения конфликтов при перезагрузке скрипта
(function() {
    'use strict';
    
    // Глобальные переменные для чата
    let messages = [];
    let partners = [];
    let activeChats = new Set(); // Множество активных чатов
    let savedPartners = []; // Сохраненные партнеры из localStorage
    let currentUser = null;
    let currentPartner = null;
    let isSendingMessage = false; // Флаг для предотвращения дублирования отправки сообщений
    let messagePollingInterval = null; // Интервал для автоматического обновления сообщений
    let lastMessageCheck = null; // Время последней проверки сообщений

// Функция инициализации чата
async function initializeChat() {
    console.log('🚀 ИНИЦИАЛИЗАЦИЯ ЧАТА НАЧАЛАСЬ');
    
    try {
        // Загружаем информацию о текущем пользователе
        console.log('👤 Загружаем информацию о текущем пользователе...');
        await loadCurrentUserInfo();
        
        if (!currentUser) {
            console.error('❌ Не удалось загрузить информацию о пользователе');
            return;
        }
        
        console.log('✅ Информация о текущем пользователе загружена:', currentUser);
        
        // Загружаем список собеседников
        console.log('👥 Загружаем список собеседников...');
        await loadConversationPartners();
        
        console.log('✅ Список собеседников загружен:', partners.length, 'пользователей');
        
        // Загружаем непрочитанные сообщения
        console.log('📬 Загружаем непрочитанные сообщения...');
        await loadUnreadMessages();
        
        console.log('✅ Непрочитанные сообщения загружены');
        
        // Показываем приветственное сообщение
        console.log('👋 Показываем приветственное сообщение...');
        showWelcomeMessage();
        
        // Автоматически открываем первый активный чат
        console.log('🚀 Автоматически открываем чат с первым активным пользователем...');
        await openFirstActiveChat();
        
        console.log('🎉 ИНИЦИАЛИЗАЦИЯ ЧАТА ЗАВЕРШЕНА УСПЕШНО!');
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации чата:', error);
    }
}

// Загрузка информации о текущем пользователе
async function loadCurrentUserInfo() {
    try {
        const response = await fetch('/api/user/current');
        if (response.ok) {
            currentUser = await response.json();
            console.log('✅ Текущий пользователь загружен:', currentUser);
        } else {
            console.error('❌ Ошибка загрузки текущего пользователя:', response.status);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки текущего пользователя:', error);
    }
}

// Загрузка списка собеседников
async function loadConversationPartners() {
    try {
        console.log('📋 Загружаем список собеседников...');
        
        // Загружаем всех пользователей
        const response = await fetch('/api/users/all');
        if (!response.ok) {
            console.error('❌ Ошибка загрузки пользователей:', response.status);
            return;
        }
        
        const allUsers = await response.json();
        console.log('📊 Загружены все пользователи:', allUsers.length);
        
        // Фильтруем текущего пользователя
        const filteredUsers = allUsers.filter(user => user.id !== currentUser.id);
        console.log('🔍 Отфильтрованы пользователи (исключен текущий):', filteredUsers.length);
        
        // Загружаем сохраненные партнеры из localStorage
        loadSavedPartnersFromStorage();
        
        // Объединяем пользователей с сохраненными партнерами
        const allPartners = [...filteredUsers];
        
        // Добавляем сохраненных партнеров, которых нет в списке
        savedPartners.forEach(savedPartner => {
            if (!allPartners.find(partner => partner.id === savedPartner.id)) {
                allPartners.push(savedPartner);
            }
        });
        
        console.log('👥 ИТОГО партнеров:', allPartners.length);
        
        // Валидируем активные чаты
        await validateActiveChats(allPartners);
        
        // Сортируем партнеров (активные чаты вверху)
        partners = allPartners.sort((a, b) => {
            const aHasActiveChat = activeChats.has(a.id);
            const bHasActiveChat = activeChats.has(b.id);
            
            if (aHasActiveChat && !bHasActiveChat) return -1;
            if (!aHasActiveChat && bHasActiveChat) return 1;
            return 0;
        });
        
        console.log('📋 Отсортированы пользователи (активные чаты вверху):', partners);
        
        // Отображаем список собеседников
        renderConversationPartners();
        
        // Показываем активные чаты
        showActiveChats();
        
        console.log('✅ Список собеседников загружен:', partners.length, 'пользователей');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки собеседников:', error);
    }
}

// Валидация активных чатов
async function validateActiveChats(users) {
    console.log('🔍 Проверяем активные чаты на наличие сообщений...');
    
    const validActiveChats = new Set();
    
    for (const partnerId of activeChats) {
        try {
            const response = await fetch(`/api/chat/conversation/${partnerId}`);
            if (response.ok) {
                const messages = await response.json();
                if (messages.length > 0) {
                    validActiveChats.add(partnerId);
                    console.log(`✅ Пользователь ${partnerId} имеет ${messages.length} сообщений`);
                } else {
                    console.log(`❌ Пользователь ${partnerId} не имеет сообщений`);
                }
            }
        } catch (error) {
            console.error(`❌ Ошибка проверки сообщений для пользователя ${partnerId}:`, error);
        }
    }
    
    // Обновляем активные чаты
    activeChats = validActiveChats;
    saveActiveChatsToStorage();
    
    console.log('✅ Валидация активных чатов завершена. Осталось:', Array.from(activeChats));
}

// Отображение списка собеседников
function renderConversationPartners() {
    const usersList = document.getElementById('users-list');
    if (!usersList) {
        console.error('❌ Элемент users-list не найден');
        return;
    }
    
    usersList.innerHTML = '';
    
    console.log('🎨 Отображаем пользователей в боковой панели');
    console.log('📊 Количество партнеров для отображения:', partners.length);
    
    partners.forEach(partner => {
        const hasActiveChat = activeChats.has(partner.id);
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.setAttribute('data-partner-id', partner.id);
        userItem.onclick = () => openConversation(partner);
        
        userItem.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
                ${hasActiveChat ? '<div class="active-chat-indicator"></div>' : ''}
            </div>
            <div class="user-info">
                <h4>${partner.firstName} ${partner.lastName}</h4>
                <p>${partner.email}</p>
            </div>
        `;
        
        usersList.appendChild(userItem);
        console.log(`👤 Добавлен в боковую панель: ${partner.firstName} ${partner.lastName} (активный: ${hasActiveChat})`);
    });
    
    console.log('✅ Боковая панель отображена с', partners.length, 'пользователями');
}

// Открытие разговора с пользователем
async function openConversation(partner) {
    console.log('🔄 ОТКРЫТИЕ РАЗГОВОРА');
    console.log('👤 Партнер:', partner);
    console.log('👤 Текущий пользователь:', currentUser);
    
    // Если это уже текущий партнер, просто переключаемся
    if (currentPartner && currentPartner.id === partner.id) {
        console.log('🔄 Переключаемся на уже открытый чат');
        updateChatUI();
        return;
    }
    
    currentPartner = partner;
    console.log('✅ currentPartner установлен:', currentPartner.id);
    
    // Добавляем в активные чаты
    addActiveChat(partner.id);
    
    // Добавляем партнера в список, если его там нет
    const existingElement = document.querySelector(`[data-partner-id="${partner.id}"]`);
    if (!existingElement) {
        addPartnerToList(partner);
    } else {
        // Делаем активным существующий элемент
        document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
        existingElement.classList.add('active');
    }
    
    // Обновляем UI
    updateChatUI();
    
    // Закрываем мобильную боковую панель
    closeMobileSidebar();
    
    // Загружаем сообщения
    console.log('📬 Начинаем загрузку сообщений...');
    await loadMessages(partner.id);
    
    // Запускаем автоматическое обновление сообщений
    startMessagePolling();
    
    // Отмечаем как прочитанное
    console.log('✅ Отмечаем сообщения как прочитанные...');
    await markConversationAsRead();
    
    console.log('🎉 Разговор открыт успешно!');
}

// Обновление UI чата
function updateChatUI() {
    const chatWelcome = document.getElementById('chat-welcome');
    const chatArea = document.getElementById('chat-area');
    const partnerName = document.getElementById('partner-name');
    
    if (chatWelcome) chatWelcome.style.display = 'none';
    if (chatArea) chatArea.style.display = 'flex';
    if (partnerName && currentPartner) {
        partnerName.textContent = `${currentPartner.firstName.toUpperCase()} ${currentPartner.lastName.toUpperCase()}`;
    }
    
    // Обновляем активный элемент в списке
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`[data-partner-id="${currentPartner.id}"]`);
    if (activeItem) activeItem.classList.add('active');
}

// Загрузка сообщений
async function loadMessages(partnerId) {
    try {
        console.log('📬 Загружаем сообщения для пользователя:', partnerId);
        const response = await fetch(`/api/chat/conversation/${partnerId}`);
        
        if (response.ok) {
            messages = await response.json();
            console.log('✅ Загружены сообщения:', messages.length, 'шт.');
            renderMessages();
            scrollToBottom();
        } else {
            console.error('❌ Ошибка загрузки сообщений:', response.status);
            messages = [];
            renderMessages();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки сообщений:', error);
        messages = [];
        renderMessages();
    }
}

// Функция для проверки новых сообщений
async function checkForNewMessages() {
    if (!currentPartner) {
        console.log('📬 Нет активного чата, пропускаем проверку сообщений');
        return;
    }
    
    try {
        console.log('🔄 Проверяем новые сообщения для пользователя:', currentPartner.id);
        const response = await fetch(`/api/chat/conversation/${currentPartner.id}`);
        
        if (response.ok) {
            const newMessages = await response.json();
            const previousCount = messages.length;
            
            // Обновляем сообщения только если их количество изменилось
            if (newMessages.length !== previousCount) {
                console.log('📬 Обнаружены новые сообщения! Было:', previousCount, 'Стало:', newMessages.length);
                messages = newMessages;
                renderMessages();
                scrollToBottom();
                lastMessageCheck = new Date();
            }
        }
    } catch (error) {
        console.error('❌ Ошибка проверки новых сообщений:', error);
    }
}

// Функция для запуска автоматического обновления сообщений
function startMessagePolling() {
    console.log('🔄 Запускаем автоматическое обновление сообщений');
    
    // Останавливаем предыдущий интервал, если он есть
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    
    // Проверяем новые сообщения каждые 3 секунды
    messagePollingInterval = setInterval(checkForNewMessages, 3000);
    lastMessageCheck = new Date();
}

// Функция для остановки автоматического обновления сообщений
function stopMessagePolling() {
    console.log('⏹️ Останавливаем автоматическое обновление сообщений');
    
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
        messagePollingInterval = null;
    }
}

// Отображение сообщений
function renderMessages() {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) {
        console.error('❌ Элемент messages-container не найден');
        return;
    }
    
    messagesContainer.innerHTML = '';
    
    console.log('🎨 Отображаем сообщения:', messages.length, 'шт.');
    
    messages.forEach((message, index) => {
        console.log(`📝 Обрабатываем сообщение ${index + 1}:`, message);
        
        const messageElement = document.createElement('div');
        const isSent = currentUser && currentUser.id ? message.senderId === currentUser.id : false;
        
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        
        // Безопасное получение текста сообщения
        const messageText = message.message || message.text || message.content || 'Сообщение не загружено';
        
        const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }) : new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-text">${messageText}</div>
            <div class="message-time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        console.log(`📝 Сообщение ${index + 1}: ${isSent ? 'отправлено' : 'получено'} - "${messageText}"`);
    });
    
    console.log('✅ Все сообщения отображены');
}

// Отправка сообщения
async function sendMessage() {
    console.log('🚀 ФУНКЦИЯ sendMessage ВЫЗВАНА');
    
    // Защита от дублирования
    if (isSendingMessage) {
        console.log('⚠️ Сообщение уже отправляется, пропускаем дублирование');
        return;
    }
    
    isSendingMessage = true;
    
    const messageInput = document.getElementById('message-input');
    if (!messageInput) {
        console.error('❌ Элемент message-input не найден!');
        return;
    }
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) {
        console.log('❌ ПРОБЛЕМА: Нет текста сообщения');
        alert('Введите текст сообщения!');
        return;
    }
    
    if (!currentPartner) {
        console.log('❌ ПРОБЛЕМА: currentPartner не установлен');
        alert('Выберите собеседника для отправки сообщения!');
        return;
    }
    
    try {
        // Получаем CSRF токен
        const csrfResponse = await fetch('/csrf-token');
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.token;
        
        console.log('🔐 Отправляем сообщение с токеном:', csrfToken);

        const requestData = {
            recipientId: currentPartner.id,
            message: messageText
        };
        
        console.log('📤 Данные для отправки:', requestData);
        console.log('📤 JSON строка:', JSON.stringify(requestData));
        
        const response = await fetch(`/api/chat/send?_csrf=${csrfToken}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📡 Ответ сервера на отправку сообщения:', response.status);
        
        if (response.ok) {
            console.log('✅ Сообщение отправлено успешно');
            messageInput.value = '';
            
            // Добавляем в активные чаты
            addActiveChat(currentPartner.id);
            
            // Перезагружаем сообщения
            await loadMessages(currentPartner.id);
            
            // Принудительно прокручиваем к последнему сообщению
            scrollToBottom();
            
        } else {
            console.error('❌ Ошибка отправки сообщения:', response.status);
            const errorText = await response.text();
            console.error('📝 Детали ошибки:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
    } finally {
        isSendingMessage = false;
        console.log('🔄 Флаг отправки сброшен');
    }
}

// Отметка разговора как прочитанного
async function markConversationAsRead() {
    if (!currentPartner) return;
    
    try {
        const csrfResponse = await fetch('/csrf-token');
        const csrfData = await csrfResponse.json();
        const csrfToken = csrfData.token;
        
        const response = await fetch(`/api/chat/read/${currentPartner.id}?_csrf=${csrfToken}`, {
            method: 'PUT',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Сообщения отмечены как прочитанные');
        }
    } catch (error) {
        console.error('❌ Ошибка отметки как прочитанного:', error);
    }
}

// Показ приветственного сообщения
function showWelcomeMessage() {
    const chatWelcome = document.getElementById('chat-welcome');
    const chatArea = document.getElementById('chat-area');
    
    if (chatWelcome) chatWelcome.style.display = 'flex';
    if (chatArea) chatArea.style.display = 'none';
    
    // Останавливаем автоматическое обновление сообщений
    stopMessagePolling();
}

// Загрузка непрочитанных сообщений
async function loadUnreadMessages() {
    try {
        const response = await fetch('/api/chat/unread');
        if (response.ok) {
            const unreadMessages = await response.json();
            console.log('📬 Непрочитанные сообщения:', unreadMessages);
            
            // Здесь можно добавить логику для отображения уведомлений
            showUnreadNotifications(unreadMessages);
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки непрочитанных сообщений:', error);
    }
}

// Показ уведомлений о непрочитанных сообщениях
function showUnreadNotifications(unreadMessages) {
    // Простая реализация - можно улучшить
    if (unreadMessages.length > 0) {
        console.log('🔔 Есть непрочитанные сообщения:', unreadMessages.length);
    }
}

// Прокрутка к последнему сообщению
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        // Используем setTimeout для гарантии отображения сообщения
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            console.log('📜 Прокрутка к последнему сообщению выполнена');
        }, 100);
    }
}

// Управление активными чатами
function addActiveChat(partnerId) {
    activeChats.add(partnerId);
    saveActiveChatsToStorage();
    console.log('✅ Добавлен активный чат:', partnerId);
}

function saveActiveChatsToStorage() {
    localStorage.setItem('activeChats', JSON.stringify(Array.from(activeChats)));
    console.log('💾 Сохранены активные чаты в localStorage:', Array.from(activeChats));
}

function loadActiveChatsFromStorage() {
    const saved = localStorage.getItem('activeChats');
    if (saved) {
        activeChats = new Set(JSON.parse(saved));
        console.log('💾 Загружены активные чаты из localStorage:', Array.from(activeChats));
    }
}

// Управление сохраненными партнерами
function addPartnerToList(partner) {
    const usersList = document.getElementById('users-list');
    const existingElement = document.querySelector(`[data-partner-id="${partner.id}"]`);
    
    if (!existingElement && usersList) {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.setAttribute('data-partner-id', partner.id);
        userItem.onclick = () => openConversation(partner);
        
        const hasActiveChat = activeChats.has(partner.id);
        
        userItem.innerHTML = `
            <div class="user-avatar">
                <i class="fas fa-user"></i>
                ${hasActiveChat ? '<div class="active-chat-indicator"></div>' : ''}
            </div>
            <div class="user-info">
                <h4>${partner.firstName} ${partner.lastName}</h4>
                <p>${partner.email}</p>
            </div>
        `;
        
        usersList.appendChild(userItem);
        addPartnerToSaved(partner);
    }
}

function addPartnerToSaved(partner) {
    if (!savedPartners.find(p => p.id === partner.id)) {
        savedPartners.push(partner);
        savePartnersToStorage();
    }
}

function savePartnersToStorage() {
    localStorage.setItem('savedPartners', JSON.stringify(savedPartners));
}

function loadSavedPartnersFromStorage() {
    const saved = localStorage.getItem('savedPartners');
    if (saved) {
        savedPartners = JSON.parse(saved);
    } else {
        savedPartners = [];
    }
}

// Показ активных чатов
function showActiveChats() {
    console.log('✅ Активные чаты найдены и отображены с индикаторами:', Array.from(activeChats));
    console.log('💡 Пользователь может кликнуть на любой активный чат для открытия');
}

// Автоматически открываем чат с первым активным пользователем
async function openFirstActiveChat() {
    console.log('🚀 Открытие первого активного чата...');
    
    if (activeChats.size === 0) {
        console.log('📭 Нет активных чатов для автоматического открытия');
        return;
    }
    
    // Находим первого активного партнера
    const firstActivePartner = partners.find(partner => activeChats.has(partner.id));
    
    if (firstActivePartner) {
        console.log('👤 Найден первый активный партнер:', firstActivePartner.firstName, firstActivePartner.lastName);
        await openConversation(firstActivePartner);
    } else {
        console.log('👤 Первый активный партнер не найден в списке партнеров');
        
        // Если есть активные чаты, но партнеры не найдены, попробуем открыть первый доступный
        if (partners.length > 0) {
            console.log('🔄 Открываем первого доступного партнера:', partners[0].firstName, partners[0].lastName);
            await openConversation(partners[0]);
        }
    }
}

// Модальное окно выбора пользователя
function openUserSelectModal() {
    console.log('Открытие модального окна выбора пользователя');
    
    const modal = document.getElementById('user-select-modal');
    if (modal) {
        modal.style.display = 'block';
        loadAllUsers();
    }
}

function closeUserSelectModal() {
    const modal = document.getElementById('user-select-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function loadAllUsers() {
    try {
        console.log('Загрузка всех пользователей...');
        const response = await fetch('/api/users/all');
        
        if (response.ok) {
            const allUsers = await response.json();
            console.log('Загружены пользователи:', allUsers);
            renderAllUsers(allUsers);
        } else {
            console.error('Ошибка загрузки пользователей:', response.status);
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

function renderAllUsers(users) {
    const modalUsersList = document.getElementById('modal-users-list');
    if (!modalUsersList) return;
    
    modalUsersList.innerHTML = '';
    
    // Фильтруем текущего пользователя и тех, с кем уже есть чат
    const filteredUsers = users.filter(user => {
        // Исключаем текущего пользователя
        if (currentUser && currentUser.id && user.id === currentUser.id) {
            return false;
        }
        
        // Исключаем пользователей, с которыми уже есть активный чат
        if (activeChats.has(user.id)) {
            return false;
        }
        
        // Исключаем пользователей, которые уже есть в списке партнеров
        if (partners.find(partner => partner.id === user.id)) {
            return false;
        }
        
        return true;
    });
    
    console.log('Отфильтрованные пользователи (исключены существующие чаты):', filteredUsers);
    
    if (filteredUsers.length === 0) {
        // Показываем сообщение, если нет доступных пользователей
        const noUsersMessage = document.createElement('div');
        noUsersMessage.className = 'modal-user-item';
        noUsersMessage.style.textAlign = 'center';
        noUsersMessage.style.padding = '40px 20px';
        noUsersMessage.innerHTML = `
            <div style="color: #7f8c8d;">
                <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                <p>Нет доступных пользователей для создания нового чата</p>
                <small>Все пользователи уже добавлены в чаты</small>
            </div>
        `;
        modalUsersList.appendChild(noUsersMessage);
    } else {
        filteredUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'modal-user-item';
            userItem.onclick = () => selectUser(user);
            
            userItem.innerHTML = `
                <div class="modal-user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="modal-user-info">
                    <h4>${user.firstName} ${user.lastName}</h4>
                    <p>${user.email}</p>
                </div>
            `;
            
            modalUsersList.appendChild(userItem);
        });
    }
}

function selectUser(user) {
    console.log('Выбран пользователь:', user);
    
    // Проверяем, есть ли уже чат с этим пользователем
    const existingPartner = partners.find(partner => partner.id === user.id);
    if (existingPartner) {
        console.log('⚠️ Чат с этим пользователем уже существует, переключаемся на него');
        closeUserSelectModal();
        openConversation(existingPartner);
        return;
    }
    
    // Проверяем, есть ли активный чат с этим пользователем
    if (activeChats.has(user.id)) {
        console.log('⚠️ Активный чат с этим пользователем уже существует');
        closeUserSelectModal();
        return;
    }
    
    console.log('✅ Создаем новый чат с пользователем');
    closeUserSelectModal();
    openConversation(user);
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('🔧 Настройка обработчиков событий чата');
    
    // Используем делегирование событий
    document.addEventListener('click', function(e) {
        // Кнопка нового чата
        if (e.target && e.target.id === 'new-chat-btn') {
            console.log('Клик по кнопке нового чата');
            e.preventDefault();
            openUserSelectModal();
            return;
        }
        
        // Кнопка отправки сообщения
        if (e.target && (e.target.id === 'send-btn' || e.target.closest('#send-btn'))) {
            console.log('🖱️ Клик по кнопке отправки');
            e.preventDefault();
            e.stopPropagation();
            sendMessage();
            return;
        }
        
        // Кнопка отметить как прочитанное
        if (e.target && e.target.id === 'mark-read-btn') {
            console.log('Клик по кнопке отметки прочитанного');
            e.preventDefault();
            markConversationAsRead();
            return;
        }
        
        // Закрытие модального окна
        if (e.target && e.target.classList.contains('modal')) {
            console.log('Клик по фону модального окна');
            closeUserSelectModal();
            return;
        }
    });
    
    // Обработчик для textarea (отправка по Enter)
    document.addEventListener('keydown', function(e) {
        if (e.target && e.target.id === 'message-input' && e.key === 'Enter' && !e.shiftKey) {
            console.log('⌨️ Enter нажат в поле ввода - отправляем сообщение');
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Автоматическое изменение высоты textarea
    document.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'message-input') {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }
    });
    
    console.log('✅ Обработчики событий настроены');
}

// Проверяем состояние DOM и инициализируем
function checkAndInitialize() {
    console.log('🔍 Проверяем состояние DOM...');
    console.log('📊 document.readyState:', document.readyState);
    console.log('📊 window.location.hash:', window.location.hash);

    // Проверяем, что мы на странице чата
    if (window.location.hash !== '#chat') {
        console.log('⚠️ Мы не на странице чата, пропускаем инициализацию');
        return;
    }

    if (document.readyState === 'loading') {
        console.log('⏳ DOM еще загружается, ждем...');
        document.addEventListener('DOMContentLoaded', initializeChatSystem);
    } else {
        console.log('✅ DOM уже загружен, инициализируем сразу...');
        setTimeout(initializeChatSystem, 100); // Небольшая задержка для надежности
    }
}

// Основная функция инициализации
async function initializeChatSystem() {
    console.log('🚀 === НАЧИНАЕМ ИНИЦИАЛИЗАЦИЮ ЧАТА ===');
    
    try {
        // Загружаем данные из localStorage
        console.log('📦 Шаг 1: Загружаем данные из localStorage...');
        loadActiveChatsFromStorage();
        loadSavedPartnersFromStorage();
        console.log('✅ Шаг 1 завершен');
        
        // Инициализируем чат
        console.log('🎯 Шаг 2: Инициализируем чат...');
        await initializeChat();
        console.log('✅ Шаг 2 завершен');
        
        // Настраиваем обработчики событий
        console.log('⚙️ Шаг 3: Настраиваем обработчики событий...');
        setupEventListeners();
        console.log('✅ Шаг 3 завершен');
        
        console.log('🎉 ВСЯ ИНИЦИАЛИЗАЦИЯ ЧАТА ЗАВЕРШЕНА УСПЕШНО!');
        
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА при инициализации чата:', error);
    }
}

// Запускаем инициализацию
checkAndInitialize();

// Функция для диагностики CSRF токена
async function testCsrfToken() {
    console.log('🔍 === ТЕСТИРОВАНИЕ CSRF ТОКЕНА ===');
    
    try {
        const csrfResponse = await fetch('/csrf-token');
        console.log('📡 Ответ сервера на /csrf-token:', csrfResponse.status);
        
        if (csrfResponse.ok) {
            const csrfData = await csrfResponse.json();
            console.log('✅ CSRF токен получен:', csrfData);
            console.log('🔑 Токен:', csrfData.token);
            console.log('📋 Заголовок:', csrfData.headerName);
            return csrfData;
        } else {
            console.error('❌ Ошибка получения CSRF токена:', csrfResponse.status);
            return null;
        }
    } catch (error) {
        console.error('❌ Ошибка получения CSRF токена:', error);
        return null;
    }
}

// Функция для тестирования отправки сообщения
async function testSendMessage() {
    console.log('🧪 === ТЕСТИРОВАНИЕ ОТПРАВКИ СООБЩЕНИЯ ===');
    
    // Сначала тестируем CSRF токен
    const csrfData = await testCsrfToken();
    if (!csrfData) {
        console.log('❌ Не удалось получить CSRF токен');
        return;
    }
    
    if (!currentPartner) {
        console.log('❌ Нет выбранного собеседника');
        return;
    }
    
    const testMessage = 'Тестовое сообщение ' + new Date().toLocaleTimeString();
    
    try {
        const response = await fetch(`/api/chat/send?_csrf=${csrfData.token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfData.token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                recipientId: currentPartner.id,
                text: testMessage
            })
        });
        
        console.log('📡 Ответ сервера на тестовую отправку:', response.status);
        
        if (response.ok) {
            console.log('✅ Тестовое сообщение отправлено успешно');
            // Перезагружаем сообщения
            await loadMessages(currentPartner.id);
        } else {
            const errorText = await response.text();
            console.error('❌ Ошибка тестовой отправки:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Ошибка тестовой отправки:', error);
    }
    
    console.log('🧪 === ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
}

    // Функция для принудительного исправления структуры чата
    function fixChatStructure() {
        console.log('🔧 === ИСПРАВЛЕНИЕ СТРУКТУРЫ ЧАТА ===');
        
        const chatMain = document.querySelector('.chat-main');
        const chatArea = document.getElementById('chat-area');
        const chatHeader = document.querySelector('.chat-area .chat-header');
        const messagesContainer = document.getElementById('messages-container');
        const messageInputContainer = document.querySelector('.message-input-container');
        
        console.log('🔧 chatMain найден:', !!chatMain);
        console.log('🔧 chatArea найден:', !!chatArea);
        console.log('🔧 chatHeader найден:', !!chatHeader);
        console.log('🔧 messagesContainer найден:', !!messagesContainer);
        console.log('🔧 messageInputContainer найден:', !!messageInputContainer);
        
        // Исправляем структуру
        if (chatMain) {
            chatMain.style.height = '100%';
            chatMain.style.overflow = 'hidden';
            console.log('🔧 ✅ chatMain исправлен');
        }
        
        if (chatArea) {
            chatArea.style.height = '100%';
            chatArea.style.overflow = 'hidden';
            console.log('🔧 ✅ chatArea исправлен');
        }
        
        if (chatHeader) {
            chatHeader.style.flexShrink = '0';
            chatHeader.style.height = 'auto';
            console.log('🔧 ✅ chatHeader исправлен');
        }
        
        if (messagesContainer) {
            messagesContainer.style.flex = '1';
            messagesContainer.style.height = '0';
            messagesContainer.style.overflowY = 'auto';
            console.log('🔧 ✅ messagesContainer исправлен');
        }
        
        if (messageInputContainer) {
            messageInputContainer.style.flexShrink = '0';
            messageInputContainer.style.height = 'auto';
            messageInputContainer.style.display = 'block';
            messageInputContainer.style.visibility = 'visible';
            console.log('🔧 ✅ messageInputContainer исправлен');
        }
        
        console.log('🔧 === ИСПРАВЛЕНИЕ СТРУКТУРЫ ЗАВЕРШЕНО ===');
    }

    // Функция для переключения мобильной боковой панели
    function toggleMobileSidebar() {
        console.log(" Переключение мобильной боковой панели");
        
        const sidebar = document.querySelector(".chat-sidebar");
        const chatArea = document.getElementById("chat-area");
        const chatWelcome = document.getElementById("chat-welcome");
        
        if (!sidebar) {
            console.error(" Боковая панель не найдена");
            return;
        }
        
        // Переключаем класс mobile-open
        sidebar.classList.toggle("mobile-open");
        
        // Если панель открыта, скрываем чат
        if (sidebar.classList.contains("mobile-open")) {
            console.log(" Открываем боковую панель");
            if (chatArea) chatArea.style.display = "none";
            if (chatWelcome) chatWelcome.style.display = "none";
        } else {
            console.log(" Закрываем боковую панель");
            if (chatArea) chatArea.style.display = "flex";
            if (chatWelcome) chatWelcome.style.display = "flex";
        }
    }

    function closeMobileSidebar() {
        console.log(" Закрытие мобильной боковой панели");
        
        const sidebar = document.querySelector(".chat-sidebar");
        const chatArea = document.getElementById("chat-area");
        const chatWelcome = document.getElementById("chat-welcome");
        
        if (!sidebar) {
            console.error(" Боковая панель не найдена");
            return;
        }
        
        // Убираем класс mobile-open
        sidebar.classList.remove("mobile-open");
        
        // Показываем чат
        if (chatArea) chatArea.style.display = "flex";
        if (chatWelcome) chatWelcome.style.display = "flex";
    }

    // Глобальные функции для доступа из HTML
    window.openUserSelectModal = openUserSelectModal;
    window.closeUserSelectModal = closeUserSelectModal;
    window.sendMessage = sendMessage;
    window.testCsrfToken = testCsrfToken;
    window.testSendMessage = testSendMessage;
    window.fixChatStructure = fixChatStructure;
    window.toggleMobileSidebar = toggleMobileSidebar;
    window.closeMobileSidebar = closeMobileSidebar;
    window.startMessagePolling = startMessagePolling;
    window.stopMessagePolling = stopMessagePolling;
    window.checkForNewMessages = checkForNewMessages;

})(); // Закрываем IIFE
