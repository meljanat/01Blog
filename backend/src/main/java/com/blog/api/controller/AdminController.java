package com.blog.api.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.blog.api.model.Post;
import com.blog.api.model.Report;
import com.blog.api.model.User;
import com.blog.api.repository.ReportRepository;
import com.blog.api.repository.UserRepository;
import com.blog.api.repository.PostRepository;
import com.blog.api.repository.CommentRepository;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public AdminController(ReportRepository reportRepository, UserRepository userRepository,
            PostRepository postRepository, CommentRepository commentRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/posts")
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postRepository.findAll());
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
    public ResponseEntity<?> toggleUserBan(@PathVariable Long id) {
        if (id == 1) {
            return ResponseEntity.badRequest().body("You cannot ban the owner.");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsBanned(!user.getIsBanned());
        userRepository.save(user);

        String message = user.getIsBanned() ? "User has been successfully banned." : "User has been unbanned.";
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUserAsAdmin(@PathVariable Long id) {
        if (id == 1) {
            return ResponseEntity.badRequest().body("You cannot delete the owner.");
        }

        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("User not found");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted by Admin.");
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePostAsAdmin(@PathVariable Long id) {
        if (!postRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("Post not found");
        }

        postRepository.deleteById(id);
        return ResponseEntity.ok("Post deleted by Admin.");
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteCommentAsAdmin(@PathVariable Long id) {
        if (!commentRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("Comment not found");
        }

        commentRepository.deleteById(id);
        return ResponseEntity.ok("Comment deleted by Admin.");
    }
}