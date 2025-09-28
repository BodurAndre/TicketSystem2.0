package org.example.server.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class UserResetPassword {
    private String email;
    private String password;
}
