package com.nashetovreme.moment;

import com.nashetovreme.family.Family;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.moment.dto.CreateMomentRequest;
import com.nashetovreme.moment.dto.MomentResponse;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import java.util.Map;
import java.util.List;
import java.util.function.Function;
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
    private final UserRepository userRepository;

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
        moment.setCreatedByUserId(principal.getId());

        User author = userRepository.findById(principal.getId()).orElse(null);
        return toResponse(momentRepository.save(moment), author);
    }

    @Transactional(readOnly = true)
    public List<MomentResponse> getMoments(Long familyId, AuthenticatedUser principal) {
        Long resolvedFamilyId = familyId != null ? familyId : principal.getFamilyId();
        if (resolvedFamilyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Family id is required");
        }

        verifyFamilyAccess(resolvedFamilyId, principal);
        List<Moment> moments = momentRepository.findByFamilyIdOrderByCreatedAtDesc(resolvedFamilyId);
        Map<Long, User> usersById = userRepository.findAllById(
                        moments.stream()
                                .map(Moment::getCreatedByUserId)
                                .filter(id -> id != null)
                                .distinct()
                                .toList())
                .stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, Function.identity()));

        return moments.stream()
                .map(moment -> toResponse(moment, usersById.get(moment.getCreatedByUserId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public MomentResponse getMoment(Long momentId, AuthenticatedUser principal) {
        Moment moment = momentRepository.findById(momentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Moment not found"));
        verifyFamilyAccess(moment.getFamily().getId(), principal);
        User author = null;
        if (moment.getCreatedByUserId() != null) {
            author = userRepository.findById(moment.getCreatedByUserId()).orElse(null);
        }
        return toResponse(moment, author);
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }

    private MomentResponse toResponse(Moment moment, User author) {
        String authorName = author == null ? null : (author.getFirstName() + " " + author.getLastName()).trim();
        return new MomentResponse(
                moment.getId(),
                moment.getFamily().getId(),
                moment.getCreatedByUserId(),
                authorName,
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

