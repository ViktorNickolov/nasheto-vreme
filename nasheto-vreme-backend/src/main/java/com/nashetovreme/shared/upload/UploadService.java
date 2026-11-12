package com.nashetovreme.shared.upload;

import com.nashetovreme.shared.upload.dto.UploadImageResponse;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UploadService {

    private final Path basePath;
    private final long maxFileSizeBytes;

    public UploadService(UploadProperties properties) {
        this.basePath = Path.of(properties.getBaseDir()).toAbsolutePath().normalize();
        this.maxFileSizeBytes = properties.getMaxFileSizeBytes();
    }

    public UploadImageResponse storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File exceeds maximum allowed size");
        }

        String detectedType = detectImageType(file);
        if (detectedType == null || !contentTypeMatches(contentType, detectedType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image content does not match declared file type");
        }

        try {
            Files.createDirectories(basePath);

            String extension = extensionForType(detectedType);
            String fileName = UUID.randomUUID() + extension;
            Path target = basePath.resolve(fileName).normalize();

            if (!target.startsWith(basePath)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return new UploadImageResponse(fileName, detectedType, file.getSize(), "uploads/images/" + fileName);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
        }
    }

    private static boolean contentTypeMatches(String declaredType, String detectedType) {
        String normalized = declaredType.toLowerCase(Locale.ROOT);
        if ("image/jpeg".equals(detectedType)) {
            return "image/jpeg".equals(normalized) || "image/jpg".equals(normalized);
        }
        return detectedType.equals(normalized);
    }

    private static String extensionForType(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".bin";
        };
    }

    private static String detectImageType(MultipartFile file) {
        byte[] header = new byte[12];
        int bytesRead;
        try (InputStream inputStream = file.getInputStream()) {
            bytesRead = inputStream.read(header);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
        }

        if (bytesRead < 3) {
            return null;
        }

        if (matches(header, bytesRead, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF})) {
            return "image/jpeg";
        }

        if (matches(header, bytesRead, new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})) {
            return "image/png";
        }

        if (matches(header, bytesRead, "GIF87a".getBytes(StandardCharsets.US_ASCII))
                || matches(header, bytesRead, "GIF89a".getBytes(StandardCharsets.US_ASCII))) {
            return "image/gif";
        }

        if (bytesRead >= 12
                && matches(header, bytesRead, "RIFF".getBytes(StandardCharsets.US_ASCII))
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P') {
            return "image/webp";
        }

        return null;
    }

    private static boolean matches(byte[] source, int sourceLength, byte[] prefix) {
        if (sourceLength < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (source[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}

