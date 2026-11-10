package com.nashetovreme.family.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFamilyRequest(
        @NotBlank @Size(max = 120) String name
) {
}

