package com.blog.blog.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog.blog.models.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Fetch comments for a specific post, sorted by newest first
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);
}