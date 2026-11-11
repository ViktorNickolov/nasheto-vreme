package com.nashetovreme.shared.export;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.moment.Moment;
import com.nashetovreme.moment.MomentRepository;
import com.nashetovreme.question.QuestionAnswer;
import com.nashetovreme.question.QuestionAnswerRepository;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.export.dto.PdfExportRequest;
import com.nashetovreme.shared.export.dto.PdfExportResponse;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PdfExportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
            .withZone(ZoneId.systemDefault());

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

    @Transactional(readOnly = true)
    public byte[] generatePdf(PdfExportRequest request, AuthenticatedUser principal) {
        verifyFamilyAccess(request.familyId(), principal);

        String familyName = familyRepository.findById(request.familyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"))
                .getName();

        List<Moment> moments = request.includeMoments()
                ? momentRepository.findByFamilyIdOrderByCreatedAtDesc(request.familyId())
                : List.of();
        List<QuestionAnswer> answers = request.includeAnswers()
                ? questionAnswerRepository.findByFamilyIdOrderByCreatedAtDesc(request.familyId())
                : List.of();

        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, output);
            document.open();

            document.add(new Paragraph("Nasheto Vreme - Family Book"));
            document.add(new Paragraph("Family: " + familyName));
            document.add(new Paragraph("Period: " + request.period()));
            document.add(new Paragraph("Style: " + request.style()));
            document.add(new Paragraph("Generated: " + DATE_FORMAT.format(Instant.now())));
            document.add(new Paragraph(" "));

            if (!moments.isEmpty()) {
                document.add(new Paragraph("Moments"));
                PdfPTable momentsTable = new PdfPTable(3);
                momentsTable.setWidthPercentage(100);
                momentsTable.addCell(new Phrase("When"));
                momentsTable.addCell(new Phrase("Title"));
                momentsTable.addCell(new Phrase("Description"));
                for (Moment moment : moments) {
                    momentsTable.addCell(new Phrase(DATE_FORMAT.format(moment.getCreatedAt())));
                    momentsTable.addCell(new Phrase(moment.getTitle()));
                    momentsTable.addCell(new Phrase(moment.getDescription() == null ? "-" : moment.getDescription()));
                }
                document.add(momentsTable);
                document.add(new Paragraph(" "));
            }

            if (!answers.isEmpty()) {
                document.add(new Paragraph("Question Answers"));
                PdfPTable answersTable = new PdfPTable(4);
                answersTable.setWidthPercentage(100);
                answersTable.addCell(new Phrase("When"));
                answersTable.addCell(new Phrase("Question"));
                answersTable.addCell(new Phrase("Author"));
                answersTable.addCell(new Phrase("Answer"));
                for (QuestionAnswer answer : answers) {
                    answersTable.addCell(new Phrase(DATE_FORMAT.format(answer.getCreatedAt())));
                    answersTable.addCell(new Phrase(answer.getQuestion().getTitle()));
                    answersTable.addCell(new Phrase(answer.getAuthor().getFirstName() + " " + answer.getAuthor().getLastName()));
                    answersTable.addCell(new Phrase(answer.getAnswerText()));
                }
                document.add(answersTable);
            }

            if (moments.isEmpty() && answers.isEmpty()) {
                document.add(new Paragraph("No entries yet for the selected filters."));
            }

            document.close();
            return output.toByteArray();
        } catch (DocumentException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate PDF");
        }
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }
}

