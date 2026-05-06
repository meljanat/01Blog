package com.blog.api.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.blog.api.model.Report;
import com.blog.api.model.ReportType;
import com.blog.api.model.User;
import com.blog.api.repository.ReportRepository;
import com.blog.api.repository.UserRepository;
import com.blog.api.repository.PostRepository;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public ReportController(ReportRepository reportRepository, UserRepository userRepository,
            PostRepository postRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    @PostMapping
    public ResponseEntity<?> submitReport(@RequestBody Map<String, String> payload, Principal principal) {
        try {
            User reporter = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String targetTypeStr = payload.get("targetType");
            if (targetTypeStr == null || payload.get("targetId") == null) {
                return ResponseEntity.badRequest().body("Report target is required.");
            }
            targetTypeStr = targetTypeStr.toUpperCase();

            Long targetId = Long.valueOf(payload.get("targetId"));
            String reason = payload.get("reason");

            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("A justification reason is required.");
            }

            User reportedUser = null;
            switch (targetTypeStr) {
                case "USER" -> reportedUser = userRepository.findById(targetId)
                        .orElseThrow(() -> new RuntimeException("Target user not found"));
                case "POST" -> {
                    var post = postRepository.findById(targetId)
                            .orElseThrow(() -> new RuntimeException("Target post not found"));
                    reportedUser = post.getAuthor();
                }
                default -> throw new RuntimeException("Unknown target type");
            }

            if (reportedUser.getId().equals(reporter.getId())) {
                return ResponseEntity.badRequest().body("You cannot report your own content.");
            }

            Report report = new Report();
            report.setReporter(reporter);
            report.setReported(reportedUser);
            report.setTargetType(ReportType.valueOf(targetTypeStr));
            report.setTargetId(targetId);
            report.setReason(reason.trim());

            reportRepository.save(report);
            return ResponseEntity.ok("Report submitted successfully to the admin team.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid report type.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error submitting report: " + e.getMessage());
        }
    }
}
