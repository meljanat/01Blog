package com.blog.api.controller;

import java.io.IOException;
import java.security.Principal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.blog.api.model.Comment;
import com.blog.api.model.NotificationType;
import com.blog.api.model.Post;
import com.blog.api.model.User;
import com.blog.api.repository.CommentRepository;
import com.blog.api.repository.PostRepository;
import com.blog.api.repository.UserRepository;
import com.blog.api.service.FileStorageService;
import com.blog.api.service.NotificationService;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FileStorageService fileStorageService;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    public PostController(PostRepository postRepository, UserRepository userRepository,
            FileStorageService fileStorageService, CommentRepository commentRepository,
            NotificationService notificationService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Post>> getPersonalizedFeed(
            @RequestParam(required = false) Long lastId,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<User> authorsToWatch = new HashSet<>(currentUser.getFollowing());
        authorsToWatch.add(currentUser);

        PageRequest limit = PageRequest.of(0, size);

        List<Post> feed = postRepository.getFeedPosts(authorsToWatch, lastId, limit);

        return ResponseEntity.ok(feed);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPostById(@PathVariable Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return ResponseEntity.ok(post);
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<Comment>> getPaginatedComments(
            @PathVariable Long postId,
            @RequestParam(required = false) Long lastId,
            @RequestParam(defaultValue = "5") int size) {

        PageRequest limit = PageRequest.of(0, size);
        List<Comment> comments = commentRepository.getPostComments(postId, lastId, limit);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Post>> getPostsByUser(
            @PathVariable String username,
            @RequestParam(required = false) Long lastId,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest limit = PageRequest.of(0, size);
        List<Post> userPosts = postRepository.getProfilePosts(username, lastId, limit);
        return ResponseEntity.ok(userPosts);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Post> toggleLike(@PathVariable Long postId, Principal principal) {
        Post post = postRepository.findById(postId).orElseThrow();
        User user = userRepository.findByUsername(principal.getName()).orElseThrow();

        if (post.getLikes().contains(user)) {
            post.getLikes().remove(user);
        } else {
            post.getLikes().add(user);

            notificationService.sendNotification(
                    post.getAuthor(),
                    user,
                    NotificationType.LIKE,
                    post.getId(),
                    " liked your post.");
        }

        return ResponseEntity.ok(postRepository.save(post));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<Comment> addComment(
            @PathVariable Long postId,
            @RequestBody String text,
            Principal principal) {

        Post post = postRepository.findById(postId).orElseThrow(() -> new RuntimeException("Post not found"));
        User author = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = Comment.builder()
                .text(text)
                .author(author)
                .post(post)
                .build();

        Comment savedComment = commentRepository.save(comment);

        notificationService.sendNotification(
                post.getAuthor(),
                author,
                NotificationType.COMMENT,
                post.getId(),
                " commented on your post.");

        return ResponseEntity.ok(savedComment);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(@PathVariable Long postId, @RequestBody String newText, Principal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getUsername().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only edit your own posts.");
        }

        post.setText(newText);
        postRepository.save(post);

        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId, Principal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getUsername().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own posts.");
        }

        postRepository.delete(post);
        return ResponseEntity.ok().body("Post deleted successfully");
    }

    @PutMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<?> editComment(@PathVariable Long postId, @PathVariable Long commentId,
            @RequestBody String newText, Principal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = post.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthor().getUsername().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only edit your own comments.");
        }

        comment.setText(newText);
        postRepository.save(post);

        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long postId, @PathVariable Long commentId,
            Principal principal) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = post.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getAuthor().getUsername().equals(principal.getName()) &&
                !post.getAuthor().getUsername().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to delete this comment.");
        }

        post.getComments().remove(comment);
        postRepository.save(post);

        return ResponseEntity.ok("Comment deleted successfully.");
    }

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam("text") String text,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        try {
            String username = authentication.getName();
            User author = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String mediaUrl = null;
            String mediaType = null;
            if (file != null && !file.isEmpty()) {
                mediaUrl = fileStorageService.saveFile(file);
                mediaType = file.getContentType();
            }

            Post post = Post.builder()
                    .text(text)
                    .mediaUrl(mediaUrl)
                    .mediaType(mediaType)
                    .author(author)
                    .build();

            postRepository.save(post);

            if (author.getFollowers() != null && !author.getFollowers().isEmpty()) {
                for (User follower : author.getFollowers()) {
                    notificationService.sendNotification(
                            follower,
                            author,
                            NotificationType.NEW_POST,
                            post.getId(),
                            " published a new post.");
                }
            }

            return ResponseEntity.ok(post);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Error creating post: " + e.getMessage());
        }
    }
}