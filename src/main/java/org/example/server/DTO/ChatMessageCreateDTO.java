package org.example.server.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageCreateDTO {
    private String message;     // <-- вместо text
    private Long recipientId;
    private String _csrf;
}
