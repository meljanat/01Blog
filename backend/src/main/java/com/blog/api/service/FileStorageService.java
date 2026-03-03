package com.blog.api.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    @Value("${blog.upload.path}")
    private String uploadPath;

    public String saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        Path uploadDir = Paths.get(uploadPath);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + extension;

        Path destinationFilePath = uploadDir.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), destinationFilePath, StandardCopyOption.REPLACE_EXISTING);

        return uniqueFilename;
    }
}