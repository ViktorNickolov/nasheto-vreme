package com.nashetovreme.shared.export;

import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.moment.MomentRepository;
import com.nashetovreme.question.QuestionAnswerRepository;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.export.dto.PdfExportRequest;
import com.nashetovreme.shared.export.dto.PdfExportResponse;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final FamilyRepository familyRepository;
    private final MomentRepository momentRepository;
    private final QuestionAnswerRepository questionAnswerRepository;

    @Transactional(readOnly = true)
    public PdfExportResponse createPreview(PdfExportRequest request, AuthenticatedUser principal) {
        verifyFamilyAccess(request.familyId(), principal);

        if (!familyRepository.existsById(request.familyId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found");
        }

        int momentsCount = request.includeMoments() ? Math.toIntExact(momentRepository.countByFamilyId(request.familyId())) : 0;
        int answersCount = request.includeAnswers() ? Math.toIntExact(questionAnswerRepository.countByFamilyId(request.familyId())) : 0;

        return new PdfExportResponse(
                UUID.randomUUID().toString(),
                request.familyId(),
                "PREVIEW_READY",
                request.period(),
                request.style(),
                momentsCount,
                answersCount,
                "PDF generation is currently a preview skeleton. Download endpoint comes next.",
                Instant.now()
        );
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }
}

