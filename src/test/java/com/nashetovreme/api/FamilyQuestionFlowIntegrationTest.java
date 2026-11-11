package com.nashetovreme.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import static org.hamcrest.Matchers.hasItems;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FamilyQuestionFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void familyAndQuestionAnswerFlowWorks() throws Exception {
        String registerPayload = """
                {
                  "email": "flow@example.com",
                  "password": "strongPass123",
                  "firstName": "Flow",
                  "lastName": "Owner",
                  "familyName": "Flow Family"
                }
                """;

        String authResponse = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode authJson = objectMapper.readTree(authResponse);
        String accessToken = authJson.get("accessToken").asText();
        long familyId = authJson.get("user").get("familyId").asLong();

        String createQuestionPayload = """
                {
                  "title": "Koe beshe nai-hubavoto dnes?",
                  "category": "blizost",
                  "active": true
                }
                """;

        String questionResponse = mockMvc.perform(post("/api/v1/questions")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createQuestionPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Koe beshe nai-hubavoto dnes?"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long questionId = objectMapper.readTree(questionResponse).get("id").asLong();

        String answerPayload = """
                {
                  "familyId": %d,
                  "answerText": "Vecherqhme zaedno i se smqhme mnogo"
                }
                """.formatted(familyId);

        mockMvc.perform(post("/api/v1/questions/{id}/answers", questionId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(answerPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionId").value(questionId));

        mockMvc.perform(get("/api/v1/families/{id}/answers", familyId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].answerText").value("Vecherqhme zaedno i se smqhme mnogo"));

        String createMomentPayload = """
                {
                  "familyId": %d,
                  "title": "Nedelen piknik",
                  "description": "Park, plodove i mnogo usmivki",
                  "imageUrl": "https://example.com/moment.jpg"
                }
                """.formatted(familyId);

        String momentResponse = mockMvc.perform(post("/api/v1/moments")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createMomentPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Nedelen piknik"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long momentId = objectMapper.readTree(momentResponse).get("id").asLong();

        mockMvc.perform(get("/api/v1/moments")
                        .header("Authorization", "Bearer " + accessToken)
                        .param("familyId", String.valueOf(familyId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(momentId));

        mockMvc.perform(get("/api/v1/moments/{id}", momentId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value("https://example.com/moment.jpg"));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "family-photo.jpg",
                "image/jpeg",
                "demo-image-content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/uploads/images")
                        .file(file)
                        .param("familyId", String.valueOf(familyId))
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").isNotEmpty())
                .andExpect(jsonPath("$.relativePath").value(org.hamcrest.Matchers.startsWith("uploads/images/")));

        mockMvc.perform(get("/api/v1/timeline")
                        .param("familyId", String.valueOf(familyId))
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].type", hasItems("MOMENT", "ANSWER")));

        String exportPayload = """
                {
                  "familyId": %d,
                  "period": "monthly",
                  "style": "family-story",
                  "includeMoments": true,
                  "includeAnswers": true
                }
                """.formatted(familyId);

        mockMvc.perform(post("/api/v1/exports/pdf")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(exportPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PREVIEW_READY"))
                .andExpect(jsonPath("$.familyId").value(familyId));

        byte[] pdf = mockMvc.perform(post("/api/v1/exports/pdf/download")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(exportPayload))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    String contentType = result.getResponse().getContentType();
                    if (!MediaType.APPLICATION_PDF_VALUE.equals(contentType)) {
                        throw new AssertionError("Expected application/pdf but was " + contentType);
                    }
                    String disposition = result.getResponse().getHeader("Content-Disposition");
                    if (disposition == null || !disposition.contains("attachment")) {
                        throw new AssertionError("Missing attachment header");
                    }
                })
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        String pdfHeader = new String(pdf, 0, Math.min(pdf.length, 4), StandardCharsets.US_ASCII);
        if (!"%PDF".equals(pdfHeader)) {
            throw new AssertionError("Invalid PDF header");
        }
    }
}

