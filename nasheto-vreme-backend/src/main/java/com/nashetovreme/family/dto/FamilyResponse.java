package com.nashetovreme.family.dto;

import java.time.Instant;

public record FamilyResponse(
        Long id,
        String name,
        Long createdBy,
        Instant createdAt
) {
}


