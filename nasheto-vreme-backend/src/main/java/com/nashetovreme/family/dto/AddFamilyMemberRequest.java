package com.nashetovreme.family.dto;

import com.nashetovreme.user.UserRole;
import jakarta.validation.constraints.NotNull;

public record AddFamilyMemberRequest(
        @NotNull Long userId,
        @NotNull UserRole role
) {
}

