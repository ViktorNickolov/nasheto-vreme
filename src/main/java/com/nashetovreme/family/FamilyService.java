package com.nashetovreme.family;

import com.nashetovreme.family.dto.AddFamilyMemberRequest;
import com.nashetovreme.family.dto.CreateFamilyRequest;
import com.nashetovreme.family.dto.FamilyMemberResponse;
import com.nashetovreme.family.dto.FamilyResponse;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public FamilyResponse createFamily(CreateFamilyRequest request, AuthenticatedUser principal) {
        User creator = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Family family = new Family();
        family.setName(request.name().trim());
        family.setCreatedBy(creator);
        Family savedFamily = familyRepository.save(family);

        FamilyMember creatorMembership = new FamilyMember();
        creatorMembership.setFamily(savedFamily);
        creatorMembership.setUser(creator);
        creatorMembership.setRole(creator.getRole());
        creatorMembership.setJoinedAt(Instant.now());
        familyMemberRepository.save(creatorMembership);

        creator.setFamily(savedFamily);
        userRepository.save(creator);

        return toFamilyResponse(savedFamily);
    }

    @Transactional(readOnly = true)
    public FamilyResponse getFamily(Long familyId) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));
        return toFamilyResponse(family);
    }

    @Transactional
    public FamilyMemberResponse addMember(Long familyId, AddFamilyMemberRequest request) {
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (familyMemberRepository.existsByFamilyIdAndUserId(familyId, request.userId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already in family");
        }

        FamilyMember member = new FamilyMember();
        member.setFamily(family);
        member.setUser(user);
        member.setRole(request.role());
        member.setJoinedAt(Instant.now());
        FamilyMember saved = familyMemberRepository.save(member);

        if (user.getFamily() == null) {
            user.setFamily(family);
            userRepository.save(user);
        }

        return toMemberResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<FamilyMemberResponse> listMembers(Long familyId) {
        if (!familyRepository.existsById(familyId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found");
        }

        return familyMemberRepository.findByFamilyId(familyId).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    private FamilyResponse toFamilyResponse(Family family) {
        Long createdById = family.getCreatedBy() != null ? family.getCreatedBy().getId() : null;
        return new FamilyResponse(family.getId(), family.getName(), createdById, family.getCreatedAt());
    }

    private FamilyMemberResponse toMemberResponse(FamilyMember member) {
        User user = member.getUser();
        return new FamilyMemberResponse(
                member.getId(),
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                member.getRole().name(),
                member.getJoinedAt()
        );
    }
}

