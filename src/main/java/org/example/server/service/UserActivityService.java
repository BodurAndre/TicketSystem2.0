package org.example.server.service;

import org.example.server.models.User;
import org.example.server.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class UserActivityService {

    @Autowired
    private UserRepository userRepository;

    // Хранилище активных пользователей (время последней активности)
    private final ConcurrentMap<Long, Date> activeUsers = new ConcurrentHashMap<>();

    // Время неактивности для определения "офлайн" (5 минут)
    private static final long INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 минут в миллисекундах

    /**
     * Отмечает пользователя как активного
     */
    public void markUserAsActive(Long userId) {
        activeUsers.put(userId, new Date());
        
        // Обновляем в базе данных
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setLastSeen(new Date());
            user.setIsOnline(true);
            userRepository.save(user);
        }
    }

    /**
     * Отмечает пользователя как неактивного
     */
    public void markUserAsInactive(Long userId) {
        activeUsers.remove(userId);
        
        // Обновляем в базе данных
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setIsOnline(false);
            userRepository.save(user);
        }
    }

    /**
     * Проверяет, активен ли пользователь
     */
    public boolean isUserActive(Long userId) {
        Date lastActivity = activeUsers.get(userId);
        if (lastActivity == null) {
            return false;
        }
        
        long timeSinceLastActivity = System.currentTimeMillis() - lastActivity.getTime();
        return timeSinceLastActivity < INACTIVITY_THRESHOLD;
    }

    /**
     * Получает время последней активности пользователя
     */
    public Date getLastActivity(Long userId) {
        return activeUsers.get(userId);
    }

    /**
     * Периодическая задача для очистки неактивных пользователей
     * Запускается каждую минуту
     */
    @Scheduled(fixedRate = 60000) // каждую минуту
    public void cleanupInactiveUsers() {
        Date now = new Date();
        
        activeUsers.entrySet().removeIf(entry -> {
            Long userId = entry.getKey();
            Date lastActivity = entry.getValue();
            
            long timeSinceLastActivity = now.getTime() - lastActivity.getTime();
            
            if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
                // Пользователь неактивен более 5 минут
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    user.setIsOnline(false);
                    userRepository.save(user);
                }
                return true; // удаляем из активных
            }
            
            return false; // оставляем активным
        });
    }

    /**
     * Получает список всех активных пользователей
     */
    public List<User> getActiveUsers() {
        return userRepository.findByIsOnlineTrue();
    }

    /**
     * Получает количество активных пользователей
     */
    public long getActiveUsersCount() {
        return userRepository.countByIsOnlineTrue();
    }
}
