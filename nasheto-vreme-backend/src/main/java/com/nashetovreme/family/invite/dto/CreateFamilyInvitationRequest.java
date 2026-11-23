package com.nashetovreme.family.invite.dto;

import com.nashetovreme.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateFamilyInvitationRequest(
        @NotBlank @Email String email,
        @NotNull UserRole role
) {
}

