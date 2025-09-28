package org.example.server.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Date;

@AllArgsConstructor
@Data
public class UserDTO {
    private Long id;
    private String email;
    private String dateOfBirth;
    private String gender;
    private String firstName;
    private String lastName;
    private Boolean isOnline;
    private Date lastSeen;
    private String profilePhotoUrl;
    private String role;
    private boolean isUserAuthenticated;
}
