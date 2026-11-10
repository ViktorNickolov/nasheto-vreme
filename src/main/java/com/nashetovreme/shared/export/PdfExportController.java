package com.nashetovreme.shared.export;

import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.export.dto.PdfExportRequest;
import com.nashetovreme.shared.export.dto.PdfExportResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/exports/pdf")
@RequiredArgsConstructor
public class PdfExportController {

    private final PdfExportService pdfExportService;

    @PostMapping
    public PdfExportResponse createPreview(@Valid @RequestBody PdfExportRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser user) {
        return pdfExportService.createPreview(request, user);
    }
}

