package com.nashetovreme.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateQuestionRequest(
        @NotBlank @Size(max = 500) String title,
        @NotBlank @Size(max = 120) String category,
        boolean active
) {
}

