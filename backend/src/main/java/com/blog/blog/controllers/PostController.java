package com.blog.blog.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.blog.blog.models.Post;
import com.blog.blog.services.FileStorageService;
import com.blog.blog.services.PostService;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private FileStorageService fileStorageService;

    public record PostRequest(String title, String content, String mediaUrl) {
    }

    @PostMapping
    public ResponseEntity<Post> createPost(@RequestBody PostRequest req, Authentication authentication) {
        // authentication.getName() retrieves the username from the JWT token
        // automatically
        Post post = postService.createPost(req.title(), req.content(), req.mediaUrl(), authentication.getName());
        return ResponseEntity.ok(post);
    }

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @PostMapping("/upload")
    public ResponseEntity<?> createPostWithMedia(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        // 1. Save the file to disk
        String fileUrl = fileStorageService.save(file);

        // 2. Save the post details to DB
        Post post = postService.createPost(title, content, fileUrl, authentication.getName());

        return ResponseEntity.ok(post);
    }
}