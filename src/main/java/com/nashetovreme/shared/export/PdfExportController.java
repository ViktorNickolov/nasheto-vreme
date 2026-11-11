package com.nashetovreme.shared.export;

import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.export.dto.PdfExportRequest;
import com.nashetovreme.shared.export.dto.PdfExportResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/download")
    public ResponseEntity<byte[]> downloadPdf(@Valid @RequestBody PdfExportRequest request,
                                              @AuthenticationPrincipal AuthenticatedUser user) {
        byte[] pdf = pdfExportService.generatePdf(request, user);
        String fileName = "nasheto-vreme-" + LocalDate.now() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(pdf);
    }
}

