package com.blog.services;

import com.blog.models.ERole;
import com.blog.models.User;
import com.blog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    public String registerUser(String username, String email, String password, boolean isAdmin) {
        if (userRepository.existsByUsername(username)) {
            return "Error: Username is already taken!";
        }

        if (userRepository.existsByEmail(email)) {
            return "Error: Email is already in use!";
        }

        // Create new user's account
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(encoder.encode(password)); // Hashing the password!
        
        // Assign role
        user.setRole(isAdmin ? ERole.ROLE_ADMIN : ERole.ROLE_USER);

        userRepository.save(user);
        return "User registered successfully!";
    }
}