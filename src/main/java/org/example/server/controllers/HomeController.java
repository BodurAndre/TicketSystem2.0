package org.example.server.controllers;

import org.example.server.DTO.RequestListDTO;
import org.example.server.models.Request;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class HomeController {


    @GetMapping(value = "/")
    public String home(){
        return "support/support";
    }

    @GetMapping(value = "/create")
    public String create(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        boolean isUser = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_USER"));

        if (isAdmin || isUser) {
            return "support/support-create"; // Возвращаем имя шаблона для редактирования
        } else {
            return "403";
        }
    }

    @GetMapping(value = "/editRequest/{id}")
    public String editRequest() {
        return "support/support-edit"; // Возвращаем имя шаблона для редактирования
    }

    @GetMapping(value = "/account/CreateUser")
    public String createUser() {
        return "support/account/create-user";
    }

    @GetMapping(value = "/support/close")
    public String close(){
        return "support/support-close";
    }

    @GetMapping(value = "/support/AllAccount")
    public String users(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return "support/account/support-users"; // Возвращаем имя шаблона для редактирования
        } else {
            return "403";
        }
    }

    @GetMapping(value = "/editUser/{id}")
    public String editUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return "support/account/user-edit"; // Возвращаем имя шаблона для редактирования// Возвращаем имя шаблона для редактирования
        } else {
            return "403";
        }
    }
}
