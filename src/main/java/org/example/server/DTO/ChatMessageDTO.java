package org.example.server.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Long id;
    private String message;
    private String text; // Для WebSocket совместимости
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private Long receiverId;
    private Long recipientId; // Для WebSocket совместимости
    private String receiverName;
    private String receiverEmail;
    private LocalDateTime createdAt;
    private Boolean isRead;
    private LocalDateTime readAt;
}
