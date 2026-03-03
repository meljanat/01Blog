package com.blog.api.controller;

import com.blog.api.model.Comment;
import com.blog.api.model.Post;
import com.blog.api.model.User;
import com.blog.api.repository.CommentRepository;
import com.blog.api.repository.PostRepository;
import com.blog.api.repository.UserRepository;
import com.blog.api.service.FileStorageService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FileStorageService fileStorageService;
    private final CommentRepository commentRepository;

    public PostController(PostRepository postRepository, UserRepository userRepository,
            FileStorageService fileStorageService, CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.commentRepository = commentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Post>> getPersonalizedFeed(Principal principal) {
        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<User> authorsToWatch = new HashSet<>(currentUser.getFollowing());
        authorsToWatch.add(currentUser);

        List<Post> feed = postRepository.findByAuthorInOrderByCreatedAtDesc(authorsToWatch);

        return ResponseEntity.ok(feed);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPostById(@PathVariable Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return ResponseEntity.ok(post);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Post>> getPostsByUser(@PathVariable String username) {
        List<Post> userPosts = postRepository.findByAuthorUsernameOrderByCreatedAtDesc(username);
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
            return ResponseEntity.ok(post);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating post: " + e.getMessage());
        }
    }
}