package com.nashetovreme.privacy;

import com.nashetovreme.privacy.dto.CreatePrivacyRequest;
import com.nashetovreme.privacy.dto.PrivacyExportResponse;
import com.nashetovreme.privacy.dto.PrivacyRequestResponse;
import com.nashetovreme.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/privacy")
@RequiredArgsConstructor
public class PrivacyController {

    private final PrivacyService privacyService;

    @PostMapping("/requests")
    public PrivacyRequestResponse createRequest(@Valid @RequestBody CreatePrivacyRequest request,
                                                @AuthenticationPrincipal AuthenticatedUser principal) {
        return privacyService.createRequest(request, principal);
    }

    @GetMapping("/requests/me")
    public List<PrivacyRequestResponse> listMyRequests(@AuthenticationPrincipal AuthenticatedUser principal) {
        return privacyService.listMyRequests(principal);
    }

    @GetMapping("/export/me")
    public PrivacyExportResponse exportMyData(@AuthenticationPrincipal AuthenticatedUser principal) {
        return privacyService.exportMyData(principal);
    }
}

