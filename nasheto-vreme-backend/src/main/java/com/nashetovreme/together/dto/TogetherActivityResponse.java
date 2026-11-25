package com.nashetovreme.together.dto;

import java.time.Instant;

public record TogetherActivityResponse(
        Long id,
        Long familyId,
        Long authorId,
        String authorName,
        String title,
        String category,
        String description,
        Integer durationMinutes,
        Instant createdAt
) {
}

