package com.blog.api.repository;

import com.blog.api.model.User;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);

  Boolean existsByUsername(String username);

  Boolean existsByEmail(String email);

  @Query("""
      SELECT u FROM User u
      WHERE u.username <> :currentUsername
        AND u.isBanned = false
        AND u NOT IN (
          SELECT f FROM User me JOIN me.following f
          WHERE me.username = :currentUsername
        )
      ORDER BY function('random')
      """)
  List<User> findRandomSuggestedUsers(@Param("currentUsername") String currentUsername, Pageable pageable);
}
