package com.blog.controllers;

import com.blog.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allows Angular to talk to Spring
public class AuthController {

    @Autowired
    AuthService authService;

    // A simple DTO (Data Transfer Object) for registration
    public record SignupRequest(String username, String email, String password, boolean isAdmin) {}

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        String result = authService.registerUser(
                signUpRequest.username(),
                signUpRequest.email(),
                signUpRequest.password(),
                signUpRequest.isAdmin()
        );

        if (result.contains("Error")) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }
}