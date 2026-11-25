package com.nashetovreme.emotion;

import com.nashetovreme.emotion.dto.CreateEmotionRequest;
import com.nashetovreme.emotion.dto.EmotionResponse;
import com.nashetovreme.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/emotions")
@RequiredArgsConstructor
public class EmotionController {

    private final EmotionService emotionService;

    @PostMapping
    public EmotionResponse createEmotion(@Valid @RequestBody CreateEmotionRequest request,
                                         @AuthenticationPrincipal AuthenticatedUser principal) {
        return emotionService.createEmotion(request, principal);
    }

    @GetMapping
    public List<EmotionResponse> getFamilyEmotions(@RequestParam(required = false) Long familyId,
                                                   @AuthenticationPrincipal AuthenticatedUser principal) {
        return emotionService.getFamilyEmotions(familyId, principal);
    }
}

