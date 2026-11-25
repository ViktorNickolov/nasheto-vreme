package com.nashetovreme.privacy.dto;

import com.nashetovreme.privacy.PrivacyRequestType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreatePrivacyRequest(
        @NotNull PrivacyRequestType requestType,
        @Size(max = 1000) String note
) {
}

