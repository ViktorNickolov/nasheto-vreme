package com.nashetovreme.security.dto;

public record UserProfileResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String role,
        Long familyId,
        String familyName
) {
}


