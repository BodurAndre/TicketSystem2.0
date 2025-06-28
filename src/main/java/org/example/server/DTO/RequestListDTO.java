package org.example.server.DTO;

import lombok.Data;

@Data
public class RequestListDTO {
    private Long id;
    private String data;
    private String time;
    private String tema;
    private UserListDTO assigneeUser;
    private UserListDTO createUser;
    private String status;
    private String priority;
    private String description;

    @Data
    public static class UserListDTO {
        private String email;
        private String firstName;
        private String lastName;
    }
}
