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
import com.blog.api.repository.PostRepository;
import com.blog.api.repository.ReportRepository;
import com.blog.api.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;

    public AdminController(UserRepository userRepository, PostRepository postRepository,
            ReportRepository reportRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.reportRepository = reportRepository;
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

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePostAsAdmin(@PathVariable Long id) {
        if (!postRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("Post not found");
        }
        postRepository.deleteById(id);
        return ResponseEntity.ok("Post deleted by Admin.");
    }
}