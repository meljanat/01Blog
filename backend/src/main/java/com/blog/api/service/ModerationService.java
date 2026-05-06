package com.blog.api.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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
}
