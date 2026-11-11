package com.nashetovreme.question.dto;

import java.time.Instant;

public record QuestionAnswerResponse(
        Long id,
        Long questionId,
        String questionTitle,
        Long familyId,
        Long authorId,
        String authorName,
        String answerText,
        Instant createdAt
) {
}

