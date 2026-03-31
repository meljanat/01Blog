package com.blog.api.repository;

import com.blog.api.model.Post;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.blog.api.model.User;

import java.util.List;
import java.util.Set;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE p.author.username = :username AND (:lastId IS NULL OR p.id < :lastId) ORDER BY p.id DESC")
    List<Post> getProfilePosts(@Param("username") String username, @Param("lastId") Long lastId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.author IN :authors AND (:lastId IS NULL OR p.id < :lastId) ORDER BY p.id DESC")
    List<Post> getFeedPosts(@Param("authors") Set<User> authors, @Param("lastId") Long lastId, Pageable pageable);

    List<Post> findAllByOrderByCreatedAtDesc();
}