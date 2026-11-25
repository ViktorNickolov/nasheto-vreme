package com.nashetovreme.privacy.dto;

import java.time.Instant;

public record PrivacyRequestResponse(
        Long id,
        String requestType,
        String status,
        String note,
        Instant createdAt
) {
}

