package org.example.server.controllers;

import lombok.extern.slf4j.Slf4j;
import org.example.server.DTO.UserDTO;
import org.example.server.models.User;
import org.example.server.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@Slf4j
public class UserController {

    private final UserService userService;

    public UserController(final UserService userService) {
        this.userService = userService;
    }

    @GetMapping(value = "/getUsers", produces = "application/json")
    @ResponseBody
    public List<User> getAllUsers() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userService.getAllUsersWithoutCurrentUser(username);
    }

    @GetMapping(value = "/getUser/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> getRequest(@PathVariable long id) {
        User user = userService.getUser(id);

        if (user == null) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Не найден пользователь");

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }

        return ResponseEntity.ok(user);
    }

    @GetMapping(value = "/getDTOUser", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> getDTOUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не аутентифицирован");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Недостаточно прав для доступа");
        }

        String username;
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        List<User> users = userService.getAllUsersWithoutCurrentUser(username);

        List<UserDTO> userDTO = users.stream()
                .map(user -> new UserDTO(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(userDTO);
    }

}
