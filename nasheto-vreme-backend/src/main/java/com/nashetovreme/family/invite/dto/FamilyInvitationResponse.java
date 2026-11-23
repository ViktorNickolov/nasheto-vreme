package com.nashetovreme.family.invite.dto;

import java.time.Instant;

public record FamilyInvitationResponse(
        Long id,
        String email,
        String role,
        Instant expiresAt,
        String deliveryStatus,
        String inviteLink
) {
}

