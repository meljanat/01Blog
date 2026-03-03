package com.blog.api.controller;

import com.blog.api.model.User;
import com.blog.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> getUserProfile(@PathVariable String username, Principal principal) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isFollowing = false;
        if (principal != null) {
            User currentUser = userRepository.findByUsername(principal.getName()).orElse(null);
            if (currentUser != null) {
                isFollowing = targetUser.getFollowers().contains(currentUser);
            }
        }

        Map<String, Object> profileData = new HashMap<>();
        profileData.put("id", targetUser.getId());
        profileData.put("username", targetUser.getUsername());
        profileData.put("bio", targetUser.getBio());
        profileData.put("profilePictureUrl", targetUser.getProfilePictureUrl());
        profileData.put("followersCount", targetUser.getFollowers().size());
        profileData.put("followingCount", targetUser.getFollowing().size());
        profileData.put("isFollowing", isFollowing);

        return ResponseEntity.ok(profileData);
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<?> followUser(@PathVariable String username, Principal principal) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (currentUser.getId().equals(targetUser.getId())) {
            return ResponseEntity.badRequest().body("You cannot follow yourself.");
        }

        currentUser.follow(targetUser);
        userRepository.save(currentUser);

        return ResponseEntity.ok("Successfully followed " + username);
    }

    @PostMapping("/{username}/unfollow")
    public ResponseEntity<?> unfollowUser(@PathVariable String username, Principal principal) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        currentUser.unfollow(targetUser);
        userRepository.save(currentUser);

        return ResponseEntity.ok("Successfully unfollowed " + username);
    }
}