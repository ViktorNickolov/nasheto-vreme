package com.nashetovreme.family;

import com.nashetovreme.family.dto.AddFamilyMemberRequest;
import com.nashetovreme.family.dto.CreateFamilyRequest;
import com.nashetovreme.family.dto.FamilyMemberResponse;
import com.nashetovreme.family.dto.FamilyResponse;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/families")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    public FamilyResponse createFamily(@Valid @RequestBody CreateFamilyRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser user) {
        return familyService.createFamily(request, user);
    }

    @GetMapping("/{id}")
    public FamilyResponse getFamily(@PathVariable Long id,
                                    @AuthenticationPrincipal AuthenticatedUser user) {
        return familyService.getFamily(id, user);
    }

    @PostMapping("/{id}/members")
    public FamilyMemberResponse addMember(@PathVariable Long id,
                                          @Valid @RequestBody AddFamilyMemberRequest request,
                                          @AuthenticationPrincipal AuthenticatedUser user) {
        return familyService.addMember(id, request, user);
    }

    @GetMapping("/{id}/members")
    public List<FamilyMemberResponse> listMembers(@PathVariable Long id,
                                                   @AuthenticationPrincipal AuthenticatedUser user) {
        return familyService.listMembers(id, user);
    }
}

