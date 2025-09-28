package org.example.server.controllers;

import lombok.extern.slf4j.Slf4j;
import org.example.server.DTO.*;
import org.example.server.models.Request;
import org.example.server.models.User;
import org.example.server.service.UserService;
import org.example.server.service.UserActivityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserActivityService userActivityService;

    public UserController(final UserService userService, final UserActivityService userActivityService) {
        this.userService = userService;
        this.userActivityService = userActivityService;
    }

    @GetMapping(value = "/getUsers", produces = "application/json")
    @ResponseBody
    public List<UserDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping(value = "/api/users", produces = "application/json")
    @ResponseBody
    public List<User> getAllUsersWithoutCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        return userService.getAllUsersWithoutCurrentUser(username);
    }

    @GetMapping(value = "/api/users/all", produces = "application/json")
    @ResponseBody
    public List<UserDTO> getAllUsersForChat() {
        return userService.getAllUsers();
    }


    @PostMapping("/resetPasswordUser")
    public ResponseEntity<?> resetPassword(@RequestParam Long id) {
        try {
            // Генерируем временный пароль
            String tempPassword = generateTempPassword();

            // Сбрасываем пароль в БД
            String email = userService.resetPasswordUser(id, tempPassword);

            // Создаём DTO с логином и новым паролем
            UserResetPassword userResetPassword = new UserResetPassword(email, tempPassword);

            return ResponseEntity.ok(userResetPassword);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Ошибка при сбросе пароля"));
        }
    }

    @PostMapping(value = "/createUser", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> createUser(@RequestBody UserCreateDTO userCreateDTO) {
        try {
            log.warn("userCreateDTO - " + userCreateDTO);
            // Генерируем временный пароль
            String tempPassword = generateTempPassword();
            userService.createUser(userCreateDTO, tempPassword);

            // Создаем ответ с данными пользователя
            Map<String, String> response = new HashMap<>();
            response.put("message", "Пользователь создан");
            response.put("email", userCreateDTO.getEmail());
            response.put("password", tempPassword);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Internal server error: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при создании пользователя\"}");
        }
    }

    @PostMapping("/updateUser")
    public ResponseEntity<?> updateUser(@RequestBody UserUpdateDTO userUpdateDTO) {
        try {
            log.warn("userUpdateDTO - " + userUpdateDTO);
            userService.updateUser(userUpdateDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("{\"message\": \"Данные пользователя обновлены\"}");
        } catch (Exception e) {
            log.error("Internal server error: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при обновлении пользователя\"}");
        }
    }

    @PostMapping("/deleteUser")
    public ResponseEntity<?> deleteUser(@RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("id");
            log.warn("Deleting user with ID: " + userId);
            userService.deleteUser(userId);
            return ResponseEntity.status(HttpStatus.OK)
                    .body("{\"message\": \"Пользователь удален\"}");
        } catch (Exception e) {
            log.error("Internal server error: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при удалении пользователя\"}");
        }
    }

    @GetMapping("/api/user/current")
    @ResponseBody
    public ResponseEntity<?> getCurrentUser() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String username;

            if (principal instanceof UserDetails) {
                username = ((UserDetails) principal).getUsername();
            } else {
                username = principal.toString();
            }

            User user = userService.getUserByEmail(username);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("{\"message\": \"Пользователь не найден\"}");
            }
            UserDTO userDTO = new UserDTO(
                    user.getId(),
                    user.getEmail(),
                    user.getDateOfBirth(),
                    user.getGender(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getIsOnline(),
                    user.getLastSeen(),
                    user.getProfilePhotoUrl(),
                    user.getRole(),
                    true // так как это и есть текущий пользователь
            );
            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при получении данных пользователя\"}");
        }
    }

    // Endpoint для отметки активности пользователя
    @PostMapping("/api/user/activity")
    @ResponseBody
    public ResponseEntity<String> markUserActivity() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String username;
            
            if (principal instanceof UserDetails) {
                username = ((UserDetails) principal).getUsername();
            } else {
                username = principal.toString();
            }
            
            User user = userService.getUserByEmail(username);
            if (user != null) {
                userActivityService.markUserAsActive(user.getId());
                return ResponseEntity.ok("{\"message\": \"Активность отмечена\"}");
            }
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("{\"message\": \"Пользователь не найден\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при отметке активности\"}");
        }
    }

    // Endpoint для получения активных пользователей
    @GetMapping("/api/users/active")
    @ResponseBody
    public ResponseEntity<List<User>> getActiveUsers() {
        try {
            List<User> activeUsers = userActivityService.getActiveUsers();
            return ResponseEntity.ok(activeUsers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Endpoint для получения количества активных пользователей
    @GetMapping("/api/users/active/count")
    @ResponseBody
    public ResponseEntity<Map<String, Long>> getActiveUsersCount() {
        try {
            long count = userActivityService.getActiveUsersCount();
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }


    @PostMapping("/updatePasswordUser")
    public ResponseEntity<?> updatePasswordUser(@RequestBody Map<String, String> body) {
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        try {
            // Получаем текущего пользователя
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();

            // Вызываем сервис
            userService.changePassword(email, oldPassword, newPassword);

            return ResponseEntity.ok(Map.of("message", "Пароль успешно изменен"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Ошибка сервера"));
        }
    }


    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();
        
        for (int i = 0; i < 8; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return password.toString();
    }


}