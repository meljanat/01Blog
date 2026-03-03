package com.blog.api.repository;

import com.blog.api.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.blog.api.model.User;

import java.util.Collection;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByAuthorUsernameOrderByCreatedAtDesc(String username);

    List<Post> findByAuthorInOrderByCreatedAtDesc(Collection<User> authors);

    List<Post> findAllByOrderByCreatedAtDesc();
}