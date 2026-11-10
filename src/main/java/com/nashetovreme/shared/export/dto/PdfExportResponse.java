package com.nashetovreme.shared.export.dto;

import java.time.Instant;

public record PdfExportResponse(
        String exportId,
        Long familyId,
        String status,
        String period,
        String style,
        int includedMoments,
        int includedAnswers,
        String note,
        Instant generatedAt
) {
}

