package com.nashetovreme.moment;

import com.nashetovreme.family.Family;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.moment.dto.CreateMomentRequest;
import com.nashetovreme.moment.dto.MomentResponse;
import com.nashetovreme.security.AuthenticatedUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class MomentService {

    private final MomentRepository momentRepository;
    private final FamilyRepository familyRepository;

    @Transactional
    public MomentResponse createMoment(CreateMomentRequest request, AuthenticatedUser principal) {
        verifyFamilyAccess(request.familyId(), principal);

        Family family = familyRepository.findById(request.familyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));

        Moment moment = new Moment();
        moment.setFamily(family);
        moment.setTitle(request.title().trim());
        moment.setDescription(trimToNull(request.description()));
        moment.setImageUrl(trimToNull(request.imageUrl()));

        return toResponse(momentRepository.save(moment));
    }

    @Transactional(readOnly = true)
    public List<MomentResponse> getMoments(Long familyId, AuthenticatedUser principal) {
        Long resolvedFamilyId = familyId != null ? familyId : principal.getFamilyId();
        if (resolvedFamilyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Family id is required");
        }

        verifyFamilyAccess(resolvedFamilyId, principal);
        return momentRepository.findByFamilyIdOrderByCreatedAtDesc(resolvedFamilyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MomentResponse getMoment(Long momentId, AuthenticatedUser principal) {
        Moment moment = momentRepository.findById(momentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Moment not found"));
        verifyFamilyAccess(moment.getFamily().getId(), principal);
        return toResponse(moment);
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }

    private MomentResponse toResponse(Moment moment) {
        return new MomentResponse(
                moment.getId(),
                moment.getFamily().getId(),
                moment.getTitle(),
                moment.getDescription(),
                moment.getImageUrl(),
                moment.getCreatedAt()
        );
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

