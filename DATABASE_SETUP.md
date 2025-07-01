# Настройка базы данных

## Проблема
После удаления таблиц они не создаются автоматически.

## Решение

### 1. Настройки в application.properties
Измените настройки в `src/main/resources/application.properties`:

```properties
# Для первого запуска (создание таблиц)
spring.jpa.hibernate.ddl-auto=create-drop
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true

# После первого успешного запуска измените на:
# spring.jpa.hibernate.ddl-auto=update
# spring.sql.init.mode=never
```

### 2. Автоматическая инициализация
Добавлен компонент `DatabaseInitializer`, который автоматически создает:
- 5 компаний
- 10 серверов (по 2 для каждой компании: Телефон и Вайбер)

### 3. SQL скрипты
- `schema.sql` - создание структуры таблиц
- `data.sql` - инициализация данных

## Пошаговая инструкция

1. **Остановите приложение** если оно запущено

2. **Удалите базу данных** (если нужно):
   ```sql
   DROP DATABASE support;
   CREATE DATABASE support;
   ```

3. **Запустите приложение** с настройками `create-drop`

4. **Проверьте логи** - должны появиться сообщения о создании компаний и серверов

5. **После успешного запуска** измените настройки обратно на `update`

## Проверка
После запуска в базе данных должны быть:
- Таблица `company` с 5 записями
- Таблица `server` с 10 записями
- Таблица `USERS` (если есть пользователи)
- Таблица `tikets` (если есть тикеты)

## Логирование
В логах приложения вы увидите:
```
Starting database initialization...
Found 0 existing companies
No data found, initializing database...
Created company: ООО "Технологии будущего" with ID: 1
...
Database initialization completed successfully
``` 