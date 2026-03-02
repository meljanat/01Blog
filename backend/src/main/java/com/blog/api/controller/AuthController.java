package com.blog.api.controller;

import com.blog.api.model.Role;
import com.blog.api.model.User;
import com.blog.api.repository.UserRepository;
import com.blog.api.security.JwtUtils;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
            PasswordEncoder encoder, JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/register")
    public String registerUser(@RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return "Error: Username is already taken!";
        }
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(Role.ROLE_USER);
        user.setIsBanned(false);
        userRepository.save(user);
        return "User registered successfully!";
    }

    @PostMapping("/login")
    public String authenticateUser(@RequestBody Map<String, String> loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.get("username"), loginRequest.get("password")));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return jwtUtils.generateJwtToken(authentication);
    }
}