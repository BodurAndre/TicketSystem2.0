package org.example.server.service;

import org.example.server.models.Request;
import org.example.server.models.User;
import org.example.server.repositories.UserRepository;
import org.springframework.stereotype.Service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(User user){
        if (userRepository.findUserByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Пользователь с таким именем уже существует.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User newUser = userRepository.save(user);
        userRepository.flush();
        return newUser;
    }

    public List<User> getAllUsersWithoutCurrentUser(String username) {
        List<User> users = userRepository.findAllByEmailNotAndRoleNot(username, "USER");
        return users.isEmpty() ? new ArrayList<>() : users;
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь с id=" + id + " не найден"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findUserByEmail(email);
    }
}