package com.nashetovreme.together;

import com.nashetovreme.family.Family;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.together.dto.CreateTogetherActivityRequest;
import com.nashetovreme.together.dto.TogetherActivityResponse;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TogetherActivityService {

    private final TogetherActivityRepository togetherActivityRepository;
    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;

    @Transactional
    public TogetherActivityResponse create(CreateTogetherActivityRequest request, AuthenticatedUser principal) {
        verifyFamilyAccess(request.familyId(), principal);
        Family family = familyRepository.findById(request.familyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));

        TogetherActivity entity = new TogetherActivity();
        entity.setFamily(family);
        entity.setCreatedByUserId(principal.getId());
        entity.setTitle(request.title().trim());
        entity.setCategory(trimToNull(request.category()));
        entity.setDescription(trimToNull(request.description()));
        entity.setDurationMinutes(request.durationMinutes());

        User author = userRepository.findById(principal.getId()).orElse(null);
        return toResponse(togetherActivityRepository.save(entity), author);
    }

    @Transactional(readOnly = true)
    public List<TogetherActivityResponse> list(Long familyId, AuthenticatedUser principal) {
        Long resolvedFamilyId = familyId != null ? familyId : principal.getFamilyId();
        if (resolvedFamilyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Family id is required");
        }

        verifyFamilyAccess(resolvedFamilyId, principal);
        List<TogetherActivity> activities = togetherActivityRepository.findByFamilyIdOrderByCreatedAtDesc(resolvedFamilyId);
        Map<Long, User> usersById = userRepository.findAllById(
                        activities.stream()
                                .map(TogetherActivity::getCreatedByUserId)
                                .filter(id -> id != null)
                                .distinct()
                                .toList())
                .stream()
                .collect(java.util.stream.Collectors.toMap(User::getId, Function.identity()));

        return activities.stream()
                .map(activity -> toResponse(activity, usersById.get(activity.getCreatedByUserId())))
                .toList();
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }

    private TogetherActivityResponse toResponse(TogetherActivity activity, User author) {
        String authorName = author == null ? null : (author.getFirstName() + " " + author.getLastName()).trim();
        return new TogetherActivityResponse(
                activity.getId(),
                activity.getFamily().getId(),
                activity.getCreatedByUserId(),
                authorName,
                activity.getTitle(),
                activity.getCategory(),
                activity.getDescription(),
                activity.getDurationMinutes(),
                activity.getCreatedAt()
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

