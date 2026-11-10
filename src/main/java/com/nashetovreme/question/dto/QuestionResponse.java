package com.nashetovreme.question.dto;

import java.time.Instant;

public record QuestionResponse(
        Long id,
        String title,
        String category,
        boolean active,
        Instant createdAt
) {
}

