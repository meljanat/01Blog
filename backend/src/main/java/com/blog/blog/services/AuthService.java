package com.blog.blog.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.blog.blog.models.ERole;
import com.blog.blog.models.User;
import com.blog.blog.repository.UserRepository;

@Service
public class AuthService {
    @Autowired
    UserRepository userRepository;
    @Autowired
    PasswordEncoder encoder;

    public String registerUser(String username, String email, String password, boolean isAdmin) {
        if (userRepository.existsByUsername(username))
            return "Error: Username taken";
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        user.setRole(isAdmin ? ERole.ROLE_ADMIN : ERole.ROLE_USER);
        userRepository.save(user);
        return "User registered successfully!";
    }
}