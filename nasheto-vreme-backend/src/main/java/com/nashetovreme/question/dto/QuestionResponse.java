package com.nashetovreme.question.dto;

import java.time.Instant;

public record QuestionResponse(
        Long id,
        String title,
        String category,
        String language,
        boolean active,
        Instant createdAt
) {
}

