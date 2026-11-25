package com.nashetovreme.privacy;

import com.nashetovreme.emotion.EmotionRepository;
import com.nashetovreme.moment.MomentRepository;
import com.nashetovreme.privacy.dto.CreatePrivacyRequest;
import com.nashetovreme.privacy.dto.PrivacyExportResponse;
import com.nashetovreme.privacy.dto.PrivacyRequestResponse;
import com.nashetovreme.question.QuestionAnswerRepository;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.together.TogetherActivityRepository;
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
public class PrivacyService {

    private final PrivacyRequestRepository privacyRequestRepository;
    private final UserRepository userRepository;
    private final QuestionAnswerRepository questionAnswerRepository;
    private final MomentRepository momentRepository;
    private final EmotionRepository emotionRepository;
    private final TogetherActivityRepository togetherActivityRepository;

    @Transactional
    public PrivacyRequestResponse createRequest(CreatePrivacyRequest request, AuthenticatedUser principal) {
        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PrivacyRequest entity = new PrivacyRequest();
        entity.setRequester(requester);
        entity.setFamily(requester.getFamily());
        entity.setRequestType(request.requestType());
        entity.setNote(trimToNull(request.note()));
        entity.setStatus("SUBMITTED");

        return toResponse(privacyRequestRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<PrivacyRequestResponse> listMyRequests(AuthenticatedUser principal) {
        return privacyRequestRepository.findByRequesterIdOrderByCreatedAtDesc(principal.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PrivacyExportResponse exportMyData(AuthenticatedUser principal) {
        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Long familyId = requester.getFamily() == null ? null : requester.getFamily().getId();
        if (familyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Family context is missing");
        }

        return new PrivacyExportResponse(
                requester.getEmail(),
                (requester.getFirstName() + " " + requester.getLastName()).trim(),
                familyId,
                questionAnswerRepository.countByFamilyIdAndAuthorId(familyId, requester.getId()),
                momentRepository.countByFamilyIdAndCreatedByUserId(familyId, requester.getId()),
                emotionRepository.countByFamilyIdAndAuthorId(familyId, requester.getId()),
                togetherActivityRepository.countByFamilyIdAndCreatedByUserId(familyId, requester.getId()),
                Instant.now()
        );
    }

    private PrivacyRequestResponse toResponse(PrivacyRequest request) {
        return new PrivacyRequestResponse(
                request.getId(),
                request.getRequestType().name(),
                request.getStatus(),
                request.getNote(),
                request.getCreatedAt()
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

