package com.nashetovreme.together.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTogetherActivityRequest(
        @NotNull Long familyId,
        @NotBlank @Size(max = 255) String title,
        @Size(max = 120) String category,
        @Size(max = 2000) String description,
        @Min(1) @Max(720) Integer durationMinutes
) {
}

