package com.nashetovreme.privacy.dto;

import java.time.Instant;

public record PrivacyExportResponse(
        String email,
        String fullName,
        Long familyId,
        long ownAnswersCount,
        long ownMomentsCount,
        long ownEmotionsCount,
        long ownTogetherActivitiesCount,
        Instant generatedAt
) {
}

