package com.blog.api.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> POST_MEDIA_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm", "video/ogg");
    private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif",
            "image/webp", ".webp",
            "video/mp4", ".mp4",
            "video/webm", ".webm",
            "video/ogg", ".ogg");

    @Value("${blog.upload.path}")
    private String uploadPath;

    public String saveFile(MultipartFile file) throws IOException {
        return savePostMedia(file);
    }

    public String saveImageFile(MultipartFile file) throws IOException {
        return saveFile(file, IMAGE_TYPES, "Only image uploads are allowed.");
    }

    public String savePostMedia(MultipartFile file) throws IOException {
        return saveFile(file, POST_MEDIA_TYPES, "Only image or video uploads are allowed.");
    }

    private String saveFile(MultipartFile file, Set<String> allowedTypes, String invalidTypeMessage)
            throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new IOException(invalidTypeMessage);
        }

        Path uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        String extension = EXTENSIONS_BY_CONTENT_TYPE.getOrDefault(contentType, "");
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        Path destinationFilePath = uploadDir.resolve(uniqueFilename).normalize();
        if (!destinationFilePath.startsWith(uploadDir)) {
            throw new IOException("Invalid upload path.");
        }

        Files.copy(file.getInputStream(), destinationFilePath, StandardCopyOption.REPLACE_EXISTING);

        return uniqueFilename;
    }

    public void deleteFile(String filename) throws IOException {
        if (filename == null || filename.isBlank()) {
            return;
        }

        Path uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
        Path filePath = uploadDir.resolve(filename).normalize();

        if (!filePath.startsWith(uploadDir)) {
            throw new IOException("Invalid upload path.");
        }

        Files.deleteIfExists(filePath);
    }
}
