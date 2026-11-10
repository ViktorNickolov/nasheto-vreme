package com.nashetovreme.shared.upload;

import com.nashetovreme.shared.upload.dto.UploadImageResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UploadService {

    private final Path basePath;

    public UploadService(UploadProperties properties) {
        this.basePath = Path.of(properties.getBaseDir()).toAbsolutePath().normalize();
    }

    public UploadImageResponse storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        try {
            Files.createDirectories(basePath);

            String extension = extractExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + extension;
            Path target = basePath.resolve(fileName).normalize();

            if (!target.startsWith(basePath)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return new UploadImageResponse(fileName, contentType, file.getSize(), "uploads/images/" + fileName);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
        }
    }

    private static String extractExtension(String originalName) {
        if (originalName == null) {
            return ".bin";
        }

        int idx = originalName.lastIndexOf('.');
        if (idx == -1 || idx == originalName.length() - 1) {
            return ".bin";
        }
        return originalName.substring(idx);
    }
}

