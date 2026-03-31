package com.blog.api.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.blog.api.model.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND (:lastId IS NULL OR c.id < :lastId) ORDER BY c.id DESC")
    List<Comment> getPostComments(@Param("postId") Long postId, @Param("lastId") Long lastId, Pageable pageable);

}