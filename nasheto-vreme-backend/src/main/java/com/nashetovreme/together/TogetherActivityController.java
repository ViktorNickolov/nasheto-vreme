package com.nashetovreme.together;

import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.together.dto.CreateTogetherActivityRequest;
import com.nashetovreme.together.dto.TogetherActivityResponse;
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
@RequestMapping("/api/v1/together-activities")
@RequiredArgsConstructor
public class TogetherActivityController {

    private final TogetherActivityService togetherActivityService;

    @PostMapping
    public TogetherActivityResponse create(@Valid @RequestBody CreateTogetherActivityRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser principal) {
        return togetherActivityService.create(request, principal);
    }

    @GetMapping
    public List<TogetherActivityResponse> list(@RequestParam(required = false) Long familyId,
                                               @AuthenticationPrincipal AuthenticatedUser principal) {
        return togetherActivityService.list(familyId, principal);
    }
}

