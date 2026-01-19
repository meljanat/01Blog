package com.blog.blog.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blog.blog.models.Post;

public interface PostRepository extends JpaRepository<Post, Long> {
    // Finds all posts by a specific user (for their "Block" page)
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    // Finds all posts for the general feed
    List<Post> findAllByOrderByCreatedAtDesc();
}