package com.blog.api.service;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blog.api.model.Comment;
import com.blog.api.model.NotificationType;
import com.blog.api.model.Post;
import com.blog.api.model.ReportType;
import com.blog.api.model.User;
import com.blog.api.repository.CommentRepository;
import com.blog.api.repository.NotificationRepository;
import com.blog.api.repository.PostRepository;
import com.blog.api.repository.ReportRepository;
import com.blog.api.repository.UserRepository;

@Service
public class ModerationService {

    private static final List<NotificationType> POST_NOTIFICATION_TYPES = List.of(
            NotificationType.LIKE,
            NotificationType.COMMENT,
            NotificationType.NEW_POST);

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;
    private final NotificationRepository notificationRepository;
    private final FileStorageService fileStorageService;

    public ModerationService(UserRepository userRepository, PostRepository postRepository,
            CommentRepository commentRepository, ReportRepository reportRepository,
            NotificationRepository notificationRepository, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.reportRepository = reportRepository;
        this.notificationRepository = notificationRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public void deletePost(Post post) {
        Post managedPost = postRepository.findById(post.getId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        deletePostInternal(managedPost);
    }

    @Transactional
    public Post setPostHidden(Post post, boolean hidden) {
        Post managedPost = postRepository.findById(post.getId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        managedPost.setHidden(hidden);

        if (hidden) {
            notificationRepository.deleteByTypeInAndTargetId(POST_NOTIFICATION_TYPES, managedPost.getId());
        }

        return postRepository.save(managedPost);
    }

    @Transactional
    public void deleteComment(Comment comment) {
        Comment managedComment = commentRepository.findById(comment.getId())
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        Post post = managedComment.getPost();
        User author = managedComment.getAuthor();
        Long postId = post.getId();

        boolean hasOtherComments = commentRepository.existsByPostIdAndAuthorIdAndIdNot(
                postId,
                author.getId(),
                managedComment.getId());

        commentRepository.delete(managedComment);

        if (!hasOtherComments) {
            notificationRepository.deleteByRecipientAndActorAndTypeAndTargetId(
                    post.getAuthor(),
                    author,
                    NotificationType.COMMENT,
                    postId);
        }
    }

    @Transactional
    public void deleteUser(User user) {
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        for (Post likedPost : postRepository.findByLikesContaining(managedUser)) {
            likedPost.getLikes().remove(managedUser);
        }

        for (User followed : new ArrayList<>(managedUser.getFollowing())) {
            managedUser.unfollow(followed);
        }

        for (User follower : new ArrayList<>(managedUser.getFollowers())) {
            follower.unfollow(managedUser);
        }

        commentRepository.deleteByAuthor(managedUser);

        for (Post post : postRepository.findByAuthor(managedUser)) {
            deletePostInternal(post);
        }

        reportRepository.deleteByReporterOrReported(managedUser, managedUser);
        notificationRepository.deleteByRecipientOrActor(managedUser, managedUser);
        deleteStoredFile(managedUser.getProfilePictureUrl());

        userRepository.delete(managedUser);
    }

    @Transactional
    public User banUser(User user, String reason, String durationKey) {
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        managedUser.setIsBanned(true);
        managedUser.setBanReason(normalizeBanReason(reason));
        managedUser.setBannedUntil(resolveBanEnd(durationKey));

        return userRepository.save(managedUser);
    }

    @Transactional
    public User unbanUser(User user) {
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        managedUser.clearBan();
        return userRepository.save(managedUser);
    }

    @Transactional
    public User refreshBanStatus(User user) {
        User managedUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        clearExpiredBan(managedUser);
        return managedUser;
    }

    @Transactional
    public List<User> refreshBanStatuses(List<User> users) {
        users.forEach(this::clearExpiredBan);
        return users;
    }

    public boolean hasActiveBan(User user) {
        return user != null && user.hasActiveBan();
    }

    public String buildBanMessage(User user) {
        String reason = user.getBanReason();
        String reasonText = reason == null || reason.isBlank()
                ? "No reason was provided."
                : reason;

        if (user.getBannedUntil() == null) {
            return "Your account is permanently banned. Reason: " + reasonText;
        }

        return "Your account is temporarily banned. Reason: " + reasonText
                + " Time left: " + formatRemainingBanTime(user.getBannedUntil()) + ".";
    }

    private void deletePostInternal(Post post) {
        reportRepository.deleteByTargetTypeAndTargetId(ReportType.POST, post.getId());
        notificationRepository.deleteByTypeInAndTargetId(POST_NOTIFICATION_TYPES, post.getId());
        deleteStoredFile(post.getMediaUrl());
        postRepository.delete(post);
    }

    private void deleteStoredFile(String filename) {
        try {
            fileStorageService.deleteFile(filename);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete stored media: " + e.getMessage(), e);
        }
    }

    private void clearExpiredBan(User user) {
        if (Boolean.TRUE.equals(user.getIsBanned()) && user.getBannedUntil() != null
                && !user.getBannedUntil().isAfter(LocalDateTime.now())) {
            user.clearBan();
            userRepository.save(user);
        }
    }

    private String normalizeBanReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            return "Violation of platform rules.";
        }
        return reason.trim();
    }

    private LocalDateTime resolveBanEnd(String durationKey) {
        String normalizedDuration = durationKey == null ? "PERMANENT" : durationKey.trim().toUpperCase(Locale.ROOT);

        return switch (normalizedDuration) {
            case "ONE_DAY" -> LocalDateTime.now().plusDays(1);
            case "THREE_DAYS" -> LocalDateTime.now().plusDays(3);
            case "ONE_WEEK" -> LocalDateTime.now().plusWeeks(1);
            default -> null;
        };
    }

    private String formatRemainingBanTime(LocalDateTime bannedUntil) {
        Duration remaining = Duration.between(LocalDateTime.now(), bannedUntil);
        if (remaining.isNegative() || remaining.isZero()) {
            return "less than a minute";
        }

        long days = remaining.toDays();
        long hours = remaining.minusDays(days).toHours();
        long minutes = remaining.minusDays(days).minusHours(hours).toMinutes();

        List<String> parts = new ArrayList<>();
        if (days > 0) {
            parts.add(days + (days == 1 ? " day" : " days"));
        }
        if (hours > 0) {
            parts.add(hours + (hours == 1 ? " hour" : " hours"));
        }
        if (days == 0 && minutes > 0) {
            parts.add(minutes + (minutes == 1 ? " minute" : " minutes"));
        }

        return parts.isEmpty() ? "less than a minute" : String.join(" ", parts);
    }
}
