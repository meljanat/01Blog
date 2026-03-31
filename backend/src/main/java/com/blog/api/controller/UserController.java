package com.blog.api.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.nio.file.Path;

import com.blog.api.model.NotificationType;
import com.blog.api.service.NotificationService;
import com.blog.api.model.User;
import com.blog.api.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public UserController(UserRepository userRepository, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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
        profileData.put("isBanned", targetUser.getIsBanned());
        profileData.put("isFollowing", isFollowing);

        return ResponseEntity.ok(profileData);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestParam(value = "bio", defaultValue = "") String bio,
            @RequestParam(value = "profilePicture", required = false) MultipartFile profilePicture,
            Principal principal) {

        try {
            User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setBio(bio);

            if (profilePicture != null && !profilePicture.isEmpty()) {
                String filename = UUID.randomUUID().toString() + "_" + profilePicture.getOriginalFilename();
                Path uploadPath = Paths.get("uploads");

                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                Path filePath = uploadPath.resolve(filename);
                Files.copy(profilePicture.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                user.setProfilePictureUrl(filename);
            }

            userRepository.save(user);

            Map<String, Object> updatedData = new HashMap<>();
            updatedData.put("username", user.getUsername());
            updatedData.put("bio", user.getBio());
            updatedData.put("profilePictureUrl", user.getProfilePictureUrl());

            return ResponseEntity.ok(updatedData);

        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Error updating profile: " + e.getMessage());
        }
    }

    @GetMapping("/suggested")
    public ResponseEntity<List<Map<String, Object>>> getSuggestedUsers(Principal principal) {
        String currentUsername = principal.getName();

        List<User> suggestedUsers = userRepository.findRandomSuggestedUsers(currentUsername);

        List<Map<String, Object>> response = suggestedUsers.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("profilePictureUrl", user.getProfilePictureUrl());
            map.put("bio", user.getBio());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
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

        notificationService.sendNotification(
                targetUser,
                currentUser,
                NotificationType.FOLLOW,
                currentUser.getId(),
                " started following you!");

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