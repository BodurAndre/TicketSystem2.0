package org.example.server.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageCreateDTO {
    private String text; // Изменено с message на text
    private Long recipientId; // Изменено с receiverId на recipientId
    private String _csrf; // CSRF токен
}
