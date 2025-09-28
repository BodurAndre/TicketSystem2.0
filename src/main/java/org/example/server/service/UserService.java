package org.example.server.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.example.server.DTO.UserCreateDTO;
import org.example.server.DTO.UserDTO;
import org.example.server.DTO.UserUpdateDTO;
import org.example.server.models.Request;
import org.example.server.models.User;
import org.example.server.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerNewUser(User user){
        if (userRepository.findUserByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Пользователь с таким именем уже существует.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User newUser = userRepository.save(user);
        userRepository.flush();
        return newUser;
    }

    public void createUser(UserCreateDTO userCreateDTO, String password){
        if (userRepository.findUserByEmail(userCreateDTO.getEmail()) != null) {
            throw new IllegalArgumentException("Пользователь с таким Email уже существует.");
        }
        User user = new User();
        user.setEmail(userCreateDTO.getEmail());
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(userCreateDTO.getFirstName());
        user.setLastName(userCreateDTO.getLastName());
        user.setGender(userCreateDTO.getGender());
        user.setDateOfBirth(userCreateDTO.getDateOfBirth());
        user.setRole(userCreateDTO.getRole());
        user.setFirstLogin(true);
        userRepository.save(user);
        userRepository.flush();
    }

    public List<User> getAllUsersWithoutCurrentUser(String username) {
        List<User> users = userRepository.findAllByEmailNot(username);
        return users.isEmpty() ? new ArrayList<>() : users;
    }

    public List<User> getAllUsersWithoutCurrentUserAndUser(String username) {
        List<User> users = userRepository.findAllByEmailNotAndRoleNot(username,"USER");
        return users.isEmpty() ? new ArrayList<>() : users;
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь с id=" + id + " не найден"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findUserByEmail(email);
    }

    public void updateUser(UserUpdateDTO userUpdateDTO) {
        User user = getUser(userUpdateDTO.getUserId());
        user.setEmail(userUpdateDTO.getEmail());
        user.setFirstName(userUpdateDTO.getFirstName());
        user.setLastName(userUpdateDTO.getLastName());
        user.setRole(userUpdateDTO.getRole());
        user.setDateOfBirth(userUpdateDTO.getDateOfBirth());
        user.setGender(userUpdateDTO.getGender());
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = getUser(id);
        userRepository.delete(user);
    }

    public String resetPasswordUser(Long id, String generatedPassword) {
        User user = getUser(id);
        user.setPassword(passwordEncoder.encode(generatedPassword));
        userRepository.save(user);
        return user.getEmail();
    }

    public long countUsers() {
        return userRepository.count();
    }

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();

        // Получаем текущего пользователя из SecurityContext
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        return users.stream()
                .map(user -> new UserDTO(
                        user.getId(),
                        user.getEmail(),
                        user.getDateOfBirth(),
                        user.getGender(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getIsOnline(),
                        user.getLastSeen(),
                        user.getProfilePhotoUrl(),
                        user.getRole(),
                        user.getEmail().equals(username) // здесь сравниваем с username
                ))
                .toList();
    }



    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public void setOnline(String email, boolean status) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Пользователь не найден");
        }

        user.setIsOnline(status);
        Date now = new Date();
        user.setLastSeen(now);
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Пользователь не найден");
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Старый пароль неверный");
        }

        if (oldPassword.equals(newPassword)) {
            throw new IllegalArgumentException("Новый пароль не должен совпадать со старым");
        }

        // Можно добавить проверку сложности пароля, длины и т.д.
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

}