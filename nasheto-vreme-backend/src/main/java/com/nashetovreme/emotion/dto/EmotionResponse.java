package com.nashetovreme.emotion.dto;

import java.time.Instant;

public record EmotionResponse(
        Long id,
        Long familyId,
        Long authorId,
        String authorName,
        String emotionType,
        String happenedNote,
        String helpedNote,
        String needsNote,
        boolean wantToTalk,
        Instant createdAt
) {
}

