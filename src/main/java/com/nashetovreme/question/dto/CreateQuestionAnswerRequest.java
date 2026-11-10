package com.nashetovreme.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateQuestionAnswerRequest(
        @NotNull Long familyId,
        @NotBlank @Size(max = 2000) String answerText
) {
}

