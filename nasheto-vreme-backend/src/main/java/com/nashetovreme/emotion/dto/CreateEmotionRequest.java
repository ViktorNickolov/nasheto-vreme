package com.nashetovreme.emotion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateEmotionRequest(
        @NotNull Long familyId,
        @NotBlank @Size(max = 40) String emotionType,
        @Size(max = 2000) String happenedNote,
        @Size(max = 2000) String helpedNote,
        @Size(max = 1000) String needsNote,
        boolean wantToTalk
) {
}

