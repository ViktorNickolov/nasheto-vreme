package com.nashetovreme.moment;

import com.nashetovreme.moment.dto.CreateMomentRequest;
import com.nashetovreme.moment.dto.MomentResponse;
import com.nashetovreme.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/moments")
@RequiredArgsConstructor
public class MomentController {

    private final MomentService momentService;

    @PostMapping
    public MomentResponse createMoment(@Valid @RequestBody CreateMomentRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser user) {
        return momentService.createMoment(request, user);
    }

    @GetMapping
    public List<MomentResponse> getMoments(@RequestParam(required = false) Long familyId,
                                           @AuthenticationPrincipal AuthenticatedUser user) {
        return momentService.getMoments(familyId, user);
    }

    @GetMapping("/{id}")
    public MomentResponse getMoment(@PathVariable Long id,
                                    @AuthenticationPrincipal AuthenticatedUser user) {
        return momentService.getMoment(id, user);
    }
}

