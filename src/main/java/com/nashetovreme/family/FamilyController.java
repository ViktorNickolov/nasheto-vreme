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
    public FamilyResponse getFamily(@PathVariable Long id) {
        return familyService.getFamily(id);
    }

    @PostMapping("/{id}/members")
    public FamilyMemberResponse addMember(@PathVariable Long id, @Valid @RequestBody AddFamilyMemberRequest request) {
        return familyService.addMember(id, request);
    }

    @GetMapping("/{id}/members")
    public List<FamilyMemberResponse> listMembers(@PathVariable Long id) {
        return familyService.listMembers(id);
    }
}

