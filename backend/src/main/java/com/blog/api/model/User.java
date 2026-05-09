package com.blog.api.model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Builder.Default
    private Boolean isBanned = false;

    @Column(length = 1000)
    private String banReason;

    private LocalDateTime bannedUntil;

    @Column(length = 500)
    private String bio;

    private String profilePictureUrl;

    @ManyToMany
    @JoinTable(name = "user_followers", joinColumns = @JoinColumn(name = "follower_id"), inverseJoinColumns = @JoinColumn(name = "followed_id"))
    @JsonIgnore
    @Builder.Default
    private Set<User> following = new HashSet<>();

    @ManyToMany(mappedBy = "following")
    @JsonIgnore
    @Builder.Default
    private Set<User> followers = new HashSet<>();

    public void follow(User userToFollow) {
        this.following.add(userToFollow);
        userToFollow.getFollowers().add(this);
    }

    public void unfollow(User userToUnfollow) {
        this.following.remove(userToUnfollow);
        userToUnfollow.getFollowers().remove(this);
    }

    public boolean hasActiveBan() {
        return Boolean.TRUE.equals(isBanned) && (bannedUntil == null || bannedUntil.isAfter(LocalDateTime.now()));
    }

    public void clearBan() {
        this.isBanned = false;
        this.banReason = null;
        this.bannedUntil = null;
    }
}
