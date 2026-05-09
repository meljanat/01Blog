package com.blog.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog.api.model.Report;
import com.blog.api.model.ReportType;
import com.blog.api.model.User;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByResolvedFalseOrderByCreatedAtAsc();

    long countByResolvedFalse();

    long countByResolvedTrue();

    void deleteByReporterOrReported(User reporter, User reported);

    void deleteByTargetTypeAndTargetId(ReportType targetType, Long targetId);
}
