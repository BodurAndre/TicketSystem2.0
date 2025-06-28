package org.example.server.controllers;

import lombok.extern.slf4j.Slf4j;
import org.example.server.DTO.RequestDTO;
import org.example.server.DTO.RequestListDTO;
import org.example.server.DTO.RequestUpdateDTO;
import org.example.server.models.Request;
import org.example.server.models.User;
import org.example.server.service.RequestService;
import org.example.server.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Controller
@Slf4j
public class SupportController {

    private final RequestService requestService;
    private final UserService userService;

    public SupportController(RequestService requestService, UserService userService) {
        this.requestService = requestService;
        this.userService = userService;
    }

    /*NEW Version*/

    @GetMapping(value = "/requests", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> requests() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не аутентифицирован");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        boolean isProcessor = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_PROCESSOR"));

        List<Request> requestList;

        if (isAdmin) {
            requestList = requestService.getAllRequests();
        } else {
            String email;
            Object principal = authentication.getPrincipal();

            if (principal instanceof UserDetails) {
                email = ((UserDetails) principal).getUsername();
            } else {
                email = principal.toString();
            }

            if (isProcessor) {
                requestList = requestService.getRequestsByCreatorEmail(email);
            } else {
                requestList = requestService.getRequestsByAssigneeEmail(email);
            }
        }

        List<RequestListDTO> dtoList = requestList.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        log.warn("RequestListOpen" + dtoList);
        return ResponseEntity.ok(dtoList);
    }

    /*NEW Version*/

    @GetMapping(value = "/getRequestsOpen", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> getRequestsOpen() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не аутентифицирован");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        boolean isProcessor = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_PROCESSOR"));

        List<Request> requestList;

        if (isAdmin) {
            requestList = requestService.getAllRequestsWithStatusOpen();
        } else {
            String email;
            Object principal = authentication.getPrincipal();

            if (principal instanceof UserDetails) {
                email = ((UserDetails) principal).getUsername();
            } else {
                email = principal.toString();
            }

            if (isProcessor) {
                requestList = requestService.getOpenRequestsByAssigneeEmail(email);
            } else {
                requestList = requestService.getOpenRequestsByCreatorEmail(email);
            }
        }

        List<RequestListDTO> dtoList = requestList.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        log.warn("RequestListOpen" + dtoList);
        return ResponseEntity.ok(dtoList);
    }



    @GetMapping(value = "/getRequestsClose", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> getRequestsClose() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не аутентифицирован");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        boolean isProcessor = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_PROCESSOR"));

        List<Request> requestList;

        if (isAdmin) {
            requestList = requestService.getAllRequestsWithStatusClose();
        } else {
            String email;
            Object principal = authentication.getPrincipal();

            if (principal instanceof UserDetails) {
                email = ((UserDetails) principal).getUsername();
            } else {
                email = principal.toString();
            }

            log.warn("Email " + email);
            log.warn("isProcessor ? " + isProcessor);
            if (isProcessor) {
                requestList = requestService.getCloseRequestsByAssigneeEmail(email);
            } else {
                requestList = requestService.getCloseRequestsByCreatorEmail(email);
            }
        }

        List<RequestListDTO> dtoList = requestList.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        log.warn("RequestListClosed" + dtoList);
        return ResponseEntity.ok(dtoList);
    }


    @GetMapping(value = "/getRequest/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> getRequest(@PathVariable long id) {
        Request request = requestService.getRequest(id);

        if (request == null) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Не найдена заявка");

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Пользователь не аутентифицирован");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        boolean isAdmin = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        boolean isProcessor = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_PROCESSOR"));
        boolean isUser = authorities.stream().anyMatch(auth -> auth.getAuthority().equals("ROLE_USER"));


        RequestListDTO requestListDTO = mapToDTO(request);
        if (isAdmin) {
            return ResponseEntity.ok(requestListDTO);
        } else {
            String email;
            Object principal = authentication.getPrincipal();

            if (principal instanceof UserDetails) {
                email = ((UserDetails) principal).getUsername();
            } else {
                email = principal.toString();
            }

            log.warn("Email " + email);
            log.warn("isProcessor ? " + isProcessor);
            if (isProcessor && requestListDTO.getAssigneeUser().getEmail().equals(email)) {
                return ResponseEntity.ok(requestListDTO);
            } else if (isUser && requestListDTO.getCreateUser().getEmail().equals(email)){
                return ResponseEntity.ok(requestListDTO);
            }
            else return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Недостаточно прав для доступа");
        }
    }


    @PostMapping("/RequestCreate")
    public ResponseEntity<?> createRequest(@RequestBody RequestDTO requestDTO) {
        try {
            // Получение текущего авторизованного пользователя

            log.warn("Request " + requestDTO);
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String username;

            if (principal instanceof UserDetails) {
                username = ((UserDetails) principal).getUsername();
            } else {
                username = principal.toString();
            }

            // Поиск пользователя, создавшего заявку
            User creator = userService.getUserByEmail(username);

            // Маппинг DTO -> Entity
            Request request = new Request();
            request.setData(requestDTO.getData());
            request.setTime(requestDTO.getTime());
            request.setTema(requestDTO.getTema());
            request.setStatus(requestDTO.getStatus());
            request.setPriority(requestDTO.getPriority());
            request.setDescription(requestDTO.getDescription());
            request.setCreateUser(creator);

            log.warn("UserID " + requestDTO.getUser());
            if(requestDTO.getUser() != null){
                User targetUser = userService.getUser(requestDTO.getUser());
                if (targetUser != null) request.setAssigneeUser(targetUser);
                else log.warn("Пользователь с ID " + requestDTO.getUser() + " не найден");
            }

            // Сохраняем
            Request savedRequest = requestService.setRequest(request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Заявка создана");
            response.put("id", savedRequest != null ? savedRequest.getID() : null);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"message\": \"Ошибка в создании заявки\"}");
        }
    }


    @PostMapping("/requestClose")
    public ResponseEntity<String> closeRequest(@RequestBody long id) {
        try {
            log.info("ID request", id);
            requestService.closeRequest(id);
            return ResponseEntity.status(HttpStatus.CREATED).body("{\"message\": \"Заявка закрыта\"}");
        } catch (Exception e) {
            log.error("Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"message\": \"Ошибка в закрытии заявки\"}");
        }
    }


    @PostMapping("/updateRequest")
    public ResponseEntity<String> updateRequest(@RequestBody RequestUpdateDTO requestData) {
        try {
            log.warn("requestData - " + requestData);

            // Получаем заявку
            Request request = requestService.getRequest(requestData.getRequestId());
            if (request == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("{\"message\": \"Заявка не найдена\"}");
            }

            // Обновляем поля заявки
            request.setTema(requestData.getTema());
            request.setPriority(requestData.getPriority());
            request.setDescription(requestData.getDescription());

            // Назначаем пользователя, если передан корректный ID
            if (requestData.getUserId() != null) {
                User user = userService.getUser(requestData.getUserId());
                if (user != null) {
                    request.setAssigneeUser(user);
                } else {
                    log.warn("Пользователь с ID " + requestData.getUserId() + " не найден");
                    // можно проигнорировать или вернуть ошибку — по желанию
                }
            }

            // Сохраняем изменения
            requestService.setRequest(request);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("{\"message\": \"Заявка обновлена\"}");

        } catch (Exception e) {
            log.error("Internal server error: " + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"message\": \"Ошибка при обновлении заявки\"}");
        }
    }


    @PostMapping("/reopenRequest")
    public ResponseEntity<String> reopenRequest(@RequestBody long id) {
        try {
            log.info("ID request", id);
            requestService.reopenRequest(id);
            return ResponseEntity.status(HttpStatus.CREATED).body("{\"message\": \"Заявка восстановлена\"}");
        } catch (Exception e) {
            log.error("Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"message\": \"Ошибка восстановление заявки\"}");
        }
    }

    private RequestListDTO mapToDTO(Request request) {
        RequestListDTO dto = new RequestListDTO();
        dto.setId(request.getID());
        dto.setData(request.getData());
        dto.setTime(request.getTime());
        dto.setTema(request.getTema());
        dto.setStatus(request.getStatus());
        dto.setPriority(request.getPriority());
        dto.setDescription(request.getDescription());

        // assigneeUser
        RequestListDTO.UserListDTO assigneeUser = new RequestListDTO.UserListDTO();
        if(request.getAssigneeUser()!=null){
            assigneeUser.setEmail(request.getAssigneeUser().getEmail());
            assigneeUser.setFirstName(request.getAssigneeUser().getFirstName());
            assigneeUser.setLastName(request.getAssigneeUser().getLastName());
        }
        else assigneeUser = null;
        dto.setAssigneeUser(assigneeUser);

        // createUser
        RequestListDTO.UserListDTO createUser = new RequestListDTO.UserListDTO();
        if(request.getCreateUser()!=null){
            createUser.setEmail(request.getCreateUser().getEmail());
            createUser.setFirstName(request.getCreateUser().getFirstName());
            createUser.setLastName(request.getCreateUser().getLastName());
        }
        else createUser = null;
        dto.setCreateUser(createUser);
        return dto;
    }
}
