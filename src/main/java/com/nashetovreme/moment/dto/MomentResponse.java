package com.nashetovreme.moment.dto;

import java.time.Instant;

public record MomentResponse(
        Long id,
        Long familyId,
        String title,
        String description,
        String imageUrl,
        Instant createdAt
) {
}

