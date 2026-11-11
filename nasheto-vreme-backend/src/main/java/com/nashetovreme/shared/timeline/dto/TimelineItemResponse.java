package com.nashetovreme.shared.timeline.dto;

import java.time.Instant;

public record TimelineItemResponse(
        String type,
        Long sourceId,
        String title,
        String details,
        String author,
        Instant createdAt
) {
}

