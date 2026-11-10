package com.nashetovreme.shared.upload.dto;

public record UploadImageResponse(
        String fileName,
        String contentType,
        long size,
        String relativePath
) {
}

