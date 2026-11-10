package com.nashetovreme.family.dto;

import java.time.Instant;

public record FamilyMemberResponse(
        Long id,
        Long userId,
        String email,
        String firstName,
        String lastName,
        String role,
        Instant joinedAt
) {
}

