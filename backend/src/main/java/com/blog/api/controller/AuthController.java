package com.blog.api.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.blog.api.model.Role;
import com.blog.api.model.User;
import com.blog.api.repository.UserRepository;
import com.blog.api.security.JwtUtils;
import com.blog.api.service.FileStorageService;
import com.blog.api.service.ModerationService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final FileStorageService fileStorageService;
    private final ModerationService moderationService;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
            PasswordEncoder encoder, JwtUtils jwtUtils, FileStorageService fileStorageService,
            ModerationService moderationService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
        this.fileStorageService = fileStorageService;
        this.moderationService = moderationService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestParam("username") String username,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        try {
            username = username.trim();
            email = email.trim().toLowerCase();

            if (username.isBlank() || email.isBlank() || password.isBlank()) {
                return ResponseEntity.badRequest().body("Username, email, and password are required.");
            }

            if (userRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest().body("Error: Username is already taken!");
            }

            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body("Error: Email is already in use!");
            }

            String profilePicUrl = fileStorageService.saveImageFile(file);

            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(encoder.encode(password));
            user.setBio(bio);
            user.setProfilePictureUrl(profilePicUrl);

            // First user gets Admin, everyone else gets User
            if (userRepository.count() == 0) {
                user.setRole(Role.ROLE_ADMIN);
            } else {
                user.setRole(Role.ROLE_USER);
            }

            userRepository.save(user);

            return ResponseEntity.ok("User registered successfully!");

        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Error during registration: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        try {
            String username = loginRequest.get("username");
            userRepository.findByUsername(username).ifPresent(user -> {
                moderationService.refreshBanStatus(user);
            });

            User loginUser = userRepository.findByUsername(username).orElse(null);
            if (loginUser != null && moderationService.hasActiveBan(loginUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(moderationService.buildBanMessage(loginUser));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username,
                            loginRequest.get("password")));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            return ResponseEntity.ok(jwt);

        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Your account has been banned by an administrator.");
        } catch (AuthenticationException e) {
            return ResponseEntity.badRequest().body("Error: Invalid username or password");
        }
    }
}
