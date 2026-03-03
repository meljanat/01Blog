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

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportController(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> submitReport(@RequestBody Map<String, String> payload, Principal principal) {
        try {
            User reporter = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String targetTypeStr = payload.get("targetType");
            Long targetId = Long.parseLong(payload.get("targetId"));
            String reason = payload.get("reason");

            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("A justification reason is required.");
            }

            Report report = new Report();
            report.setReporter(reporter);
            report.setTargetType(ReportType.valueOf(targetTypeStr.toUpperCase()));
            report.setTargetId(targetId);
            report.setReason(reason);

            reportRepository.save(report);

            return ResponseEntity.ok("Report submitted successfully to the admin team.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid report type.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error submitting report: " + e.getMessage());
        }
    }
}