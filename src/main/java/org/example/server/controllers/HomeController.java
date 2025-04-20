package org.example.server.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HomeController {


    @GetMapping(value = "/")
    public String home(){
        return "support/support";
    }

    @GetMapping(value = "/create")
    public String create(){
        return "support/support-create";
    }

    @GetMapping(value = "/editRequest/{id}")
    public String editRequest() {
        return "support/support-edit"; // Возвращаем имя шаблона для редактирования
    }

    @GetMapping(value = "/support/close")
    public String close(){
        return "support/support-close";
    }

    @GetMapping(value = "/support/AllAccount")
    public String users(){
        return "support/account/support-users";
    }

    @GetMapping(value = "/editUser/{id}")
    public String editUser() {
        return "support/account/user-edit"; // Возвращаем имя шаблона для редактирования
    }
}
