package com.blog.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog.api.model.Report;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByResolvedFalseOrderByCreatedAtAsc();
}