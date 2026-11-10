package com.nashetovreme.shared.export.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PdfExportRequest(
        @NotNull Long familyId,
        @NotBlank String period,
        @NotBlank String style,
        boolean includeMoments,
        boolean includeAnswers
) {
}

