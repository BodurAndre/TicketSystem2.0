package org.example.server.controllers;

import org.example.server.DTO.ChatMessageCreateDTO;
import org.example.server.DTO.ChatMessageDTO;
import org.example.server.models.User;
import org.example.server.service.ChatService;
import org.example.server.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    @PostMapping("/api/chat/send")
    @ResponseBody
    public ResponseEntity<?> sendMessage(
            @RequestBody ChatMessageCreateDTO messageCreateDTO,
            @RequestParam(value = "_csrf", required = false) String csrfToken) {
        try {
            System.out.println("=== ПОЛУЧЕНИЕ СООБЩЕНИЯ ===");
            System.out.println("CSRF токен: " + csrfToken);
            System.out.println("Тело сообщения: " + messageCreateDTO);
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            System.out.println("Email пользователя: " + userEmail);
            
            User currentUser = userService.getUserByEmail(userEmail);
            if (currentUser == null) {
                System.out.println("❌ Пользователь не найден");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("{\"message\": \"Пользователь не найден\"}");
            }

            System.out.println("✅ Пользователь найден: " + currentUser.getEmail());
            ChatMessageDTO message = chatService.sendMessage(messageCreateDTO, currentUser.getId());
            System.out.println("✅ Сообщение отправлено успешно: " + message);
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Ошибка валидации: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            System.out.println("❌ Общая ошибка: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при отправке сообщения\"}");
        }
    }

    @GetMapping("/api/chat/conversation/{partnerId}")
    @ResponseBody
    public ResponseEntity<?> getConversation(@PathVariable Long partnerId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User currentUser = userService.getUserByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("{\"message\": \"Пользователь не найден\"}");
            }

            List<ChatMessageDTO> messages = chatService.getConversation(currentUser.getId(), partnerId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при получении сообщений\"}");
        }
    }

    @GetMapping("/api/chat/partners")
    @ResponseBody
    public ResponseEntity<?> getConversationPartners() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User currentUser = userService.getUserByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("{\"message\": \"Пользователь не найден\"}");
            }

            List<User> partners = chatService.getConversationPartners(currentUser.getId());
            return ResponseEntity.ok(partners);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при получении списка собеседников\"}");
        }
    }

    @GetMapping("/api/chat/unread")
    @ResponseBody
    public ResponseEntity<?> getUnreadMessages() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User currentUser = userService.getUserByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("{\"message\": \"Пользователь не найден\"}");
            }

            List<ChatMessageDTO> unreadMessages = chatService.getUnreadMessages(currentUser.getId());
            return ResponseEntity.ok(unreadMessages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при получении непрочитанных сообщений\"}");
        }
    }

    @PutMapping("/api/chat/read/{partnerId}")
    @ResponseBody
    public ResponseEntity<?> markConversationAsRead(@PathVariable Long partnerId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User currentUser = userService.getUserByEmail(userEmail);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("{\"message\": \"Пользователь не найден\"}");
            }

            chatService.markConversationAsRead(currentUser.getId(), partnerId);
            return ResponseEntity.ok("{\"message\": \"Сообщения отмечены как прочитанные\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при обновлении статуса сообщений\"}");
        }
    }
}
