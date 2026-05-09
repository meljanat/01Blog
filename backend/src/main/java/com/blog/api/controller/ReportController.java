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
import com.blog.api.service.InputSanitizer;
import com.blog.api.service.ModerationService;
import com.blog.api.repository.PostRepository;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ModerationService moderationService;
    private final InputSanitizer inputSanitizer;

    public ReportController(ReportRepository reportRepository, UserRepository userRepository,
            PostRepository postRepository, ModerationService moderationService, InputSanitizer inputSanitizer) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.moderationService = moderationService;
        this.inputSanitizer = inputSanitizer;
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
            ReportType targetType;
            try {
                targetType = ReportType.valueOf(targetTypeStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid report type.");
            }

            Long targetId = Long.valueOf(payload.get("targetId"));
            String reason = inputSanitizer.requiredText(payload.get("reason"), "Report reason", 1000);

            User reportedUser = null;
            switch (targetTypeStr) {
                case "USER" -> {
                    reportedUser = userRepository.findById(targetId)
                            .orElseThrow(() -> new RuntimeException("Target user not found"));
                    reportedUser = moderationService.refreshBanStatus(reportedUser);
                    if (moderationService.hasActiveBan(reportedUser)) {
                        return ResponseEntity.badRequest().body("This profile is already banned.");
                    }
                }
                case "POST" -> {
                    var post = postRepository.findById(targetId)
                            .orElseThrow(() -> new RuntimeException("Target post not found"));
                    if (Boolean.TRUE.equals(post.getHidden())) {
                        return ResponseEntity.badRequest().body("This post is already hidden.");
                    }
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
            report.setTargetType(targetType);
            report.setTargetId(targetId);
            report.setReason(reason);

            reportRepository.save(report);
            return ResponseEntity.ok("Report submitted successfully to the admin team.");

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error submitting report: " + e.getMessage());
        }
    }
}
