package com.blog.api.controller;

import java.io.IOException;
import java.security.Principal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.blog.api.model.NotificationType;
import com.blog.api.model.Role;
import com.blog.api.service.FileStorageService;
import com.blog.api.service.InputSanitizer;
import com.blog.api.service.ModerationService;
import com.blog.api.service.NotificationService;
import com.blog.api.model.User;
import com.blog.api.repository.CommentRepository;
import com.blog.api.repository.PostRepository;
import com.blog.api.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final ModerationService moderationService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final InputSanitizer inputSanitizer;

    public UserController(UserRepository userRepository, NotificationService notificationService,
            FileStorageService fileStorageService, ModerationService moderationService,
            PostRepository postRepository, CommentRepository commentRepository, InputSanitizer inputSanitizer) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.fileStorageService = fileStorageService;
        this.moderationService = moderationService;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.inputSanitizer = inputSanitizer;
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> getUserProfile(@PathVariable String username, Principal principal) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        targetUser = moderationService.refreshBanStatus(targetUser);

        boolean isFollowing = false;
        boolean isAdminViewer = false;
        if (principal != null) {
            User currentUser = userRepository.findByUsername(principal.getName()).orElse(null);
            if (currentUser != null) {
                isAdminViewer = currentUser.getRole() == Role.ROLE_ADMIN;
                isFollowing = targetUser.getFollowers().stream()
                        .anyMatch(follower -> follower.getId().equals(currentUser.getId()));
            }
        }

        boolean targetIsBanned = moderationService.hasActiveBan(targetUser);
        long postsCount = isAdminViewer
                ? postRepository.countByAuthor(targetUser)
                : postRepository.countVisibleByAuthor(targetUser);
        if (targetIsBanned && !isAdminViewer) {
            postsCount = 0;
        }

        Map<String, Object> profileData = new HashMap<>();
        profileData.put("id", targetUser.getId());
        profileData.put("username", targetUser.getUsername());
        profileData.put("bio", targetUser.getBio());
        profileData.put("profilePictureUrl", targetUser.getProfilePictureUrl());
        profileData.put("postsCount", postsCount);
        profileData.put("commentsCount", commentRepository.countByAuthor(targetUser));
        profileData.put("followersCount", targetUser.getFollowers().size());
        profileData.put("followingCount", targetUser.getFollowing().size());
        profileData.put("isBanned", targetIsBanned);
        profileData.put("banReason", targetUser.getBanReason());
        profileData.put("bannedUntil", targetUser.getBannedUntil());
        profileData.put("banTimeLeft", targetUser.getBannedUntil() == null ? null : formatRemainingBanTime(targetUser));
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

            user.setBio(inputSanitizer.optionalText(bio, "Bio", 500));

            if (profilePicture != null && !profilePicture.isEmpty()) {
                String previousProfilePicture = user.getProfilePictureUrl();
                user.setProfilePictureUrl(fileStorageService.saveImageFile(profilePicture));
                fileStorageService.deleteFile(previousProfilePicture);
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

        List<User> suggestedUsers = userRepository.findRandomSuggestedUsers(currentUsername, PageRequest.of(0, 5));

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

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<Map<String, Object>>> getFollowers(@PathVariable String username, Principal principal) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        return ResponseEntity.ok(buildRelationshipList(targetUser.getFollowers(), currentUser));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<Map<String, Object>>> getFollowing(@PathVariable String username, Principal principal) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        return ResponseEntity.ok(buildRelationshipList(targetUser.getFollowing(), currentUser));
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

        targetUser = moderationService.refreshBanStatus(targetUser);

        if (moderationService.hasActiveBan(targetUser)) {
            return ResponseEntity.badRequest().body("You cannot follow a banned profile.");
        }

        Long targetUserId = targetUser.getId();
        if (currentUser.getFollowing().stream().anyMatch(followed -> followed.getId().equals(targetUserId))) {
            return ResponseEntity.ok("Already following " + username);
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

        notificationService.deleteNotification(
                targetUser,
                currentUser,
                NotificationType.FOLLOW,
                currentUser.getId());

        return ResponseEntity.ok("Successfully unfollowed " + username);
    }

    private List<Map<String, Object>> buildRelationshipList(Set<User> users, User currentUser) {
        return users.stream()
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(user -> buildUserSummary(user, currentUser))
                .toList();
    }

    private Map<String, Object> buildUserSummary(User user, User currentUser) {
        User refreshedUser = moderationService.refreshBanStatus(user);
        Map<String, Object> map = new HashMap<>();
        map.put("id", refreshedUser.getId());
        map.put("username", refreshedUser.getUsername());
        map.put("profilePictureUrl", refreshedUser.getProfilePictureUrl());
        map.put("bio", refreshedUser.getBio());
        map.put("isBanned", moderationService.hasActiveBan(refreshedUser));
        map.put("isFollowing", currentUser.getFollowing().stream()
                .anyMatch(followedUser -> followedUser.getId().equals(refreshedUser.getId())));
        map.put("isSelf", currentUser.getId().equals(refreshedUser.getId()));
        return map;
    }

    private String formatRemainingBanTime(User user) {
        LocalDateTime bannedUntil = user.getBannedUntil();
        if (bannedUntil == null) {
            return null;
        }

        Duration remaining = Duration.between(LocalDateTime.now(), bannedUntil);
        if (remaining.isNegative() || remaining.isZero()) {
            return "less than a minute";
        }

        long days = remaining.toDays();
        long hours = remaining.minusDays(days).toHours();
        long minutes = remaining.minusDays(days).minusHours(hours).toMinutes();

        if (days > 0) {
            return days + (days == 1 ? " day" : " days")
                    + (hours > 0 ? " " + hours + (hours == 1 ? " hour" : " hours") : "");
        }

        if (hours > 0) {
            return hours + (hours == 1 ? " hour" : " hours")
                    + (minutes > 0 ? " " + minutes + (minutes == 1 ? " minute" : " minutes") : "");
        }

        return minutes + (minutes == 1 ? " minute" : " minutes");
    }
}
