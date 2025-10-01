package org.example.server.controllers;

import lombok.extern.slf4j.Slf4j;
import org.example.server.DTO.ChatMessageDTO;
import org.example.server.models.ChatMessage;
import org.example.server.models.User;
import org.example.server.service.ChatService;
import org.example.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;

import java.util.Date;

@Controller
@Slf4j
public class WebSocketChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessageDTO sendMessage(@Payload ChatMessageDTO chatMessageDTO) {
        try {
            // Получаем текущего пользователя
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User sender = userService.getUserByEmail(username);

            if (sender == null) {
                log.error("Sender not found: " + username);
                return null;
            }

            // Создаем сообщение для сохранения в БД
            ChatMessage message = new ChatMessage();
            message.setMessage(chatMessageDTO.getText());
            message.setSender(sender);
            message.setReceiver(userService.getUserById(chatMessageDTO.getRecipientId()));
            message.setIsRead(false);

            // Сохраняем сообщение в БД
            ChatMessage savedMessage = chatService.saveMessage(message);

            // Создаем DTO для отправки клиентам
            ChatMessageDTO responseDTO = new ChatMessageDTO();
            responseDTO.setId(savedMessage.getId());
            responseDTO.setText(savedMessage.getMessage());
            responseDTO.setSenderId(savedMessage.getSender().getId());
            responseDTO.setRecipientId(savedMessage.getReceiver().getId());
            responseDTO.setCreatedAt(savedMessage.getCreatedAt());
            responseDTO.setIsRead(savedMessage.getIsRead());

            // Отправляем сообщение конкретному получателю
            messagingTemplate.convertAndSendToUser(
                chatMessageDTO.getRecipientId().toString(),
                "/queue/messages",
                responseDTO
            );

            // Также отправляем отправителю для подтверждения
            messagingTemplate.convertAndSendToUser(
                sender.getId().toString(),
                "/queue/messages",
                responseDTO
            );

            log.info("Message sent from user {} to user {}", sender.getId(), chatMessageDTO.getRecipientId());
            return responseDTO;

        } catch (Exception e) {
            log.error("Error sending message: " + e.getMessage(), e);
            return null;
        }
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public String addUser(@Payload String username) {
        log.info("User {} joined the chat", username);
        return username + " joined the chat";
    }
}