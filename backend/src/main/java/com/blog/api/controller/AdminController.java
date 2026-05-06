package com.blog.api.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.blog.api.model.Comment;
import com.blog.api.model.Post;
import com.blog.api.model.Report;
import com.blog.api.model.Role;
import com.blog.api.model.User;
import com.blog.api.repository.ReportRepository;
import com.blog.api.repository.UserRepository;
import com.blog.api.repository.PostRepository;
import com.blog.api.repository.CommentRepository;
import com.blog.api.service.ModerationService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ModerationService moderationService;

    public AdminController(ReportRepository reportRepository, UserRepository userRepository,
            PostRepository postRepository, CommentRepository commentRepository, ModerationService moderationService) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.moderationService = moderationService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/posts")
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getUnresolvedReports() {
        return ResponseEntity.ok(reportRepository.findByResolvedFalseOrderByCreatedAtAsc());
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(@PathVariable Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setResolved(true);
        reportRepository.save(report);

        return ResponseEntity.ok("Report marked as resolved.");
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<?> toggleUserBan(@PathVariable Long id, Principal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUsername().equals(principal.getName())) {
            return ResponseEntity.badRequest().body("You cannot ban your own account.");
        }

        if (user.getRole() == Role.ROLE_ADMIN) {
            return ResponseEntity.badRequest().body("Admin accounts cannot be banned.");
        }

        user.setIsBanned(!user.getIsBanned());
        userRepository.save(user);

        String message = user.getIsBanned() ? "User has been successfully banned." : "User has been unbanned.";
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUserAsAdmin(@PathVariable Long id, Principal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUsername().equals(principal.getName())) {
            return ResponseEntity.badRequest().body("You cannot delete your own account.");
        }

        if (user.getRole() == Role.ROLE_ADMIN) {
            return ResponseEntity.badRequest().body("Admin accounts cannot be deleted.");
        }

        moderationService.deleteUser(user);
        return ResponseEntity.ok("User deleted by Admin.");
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePostAsAdmin(@PathVariable Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        moderationService.deletePost(post);
        return ResponseEntity.ok("Post deleted by Admin.");
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteCommentAsAdmin(@PathVariable Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        moderationService.deleteComment(comment);
        return ResponseEntity.ok("Comment deleted by Admin.");
    }
}
