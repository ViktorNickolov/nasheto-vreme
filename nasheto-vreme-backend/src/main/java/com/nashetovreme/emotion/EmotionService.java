package com.nashetovreme.emotion;

import com.nashetovreme.emotion.dto.CreateEmotionRequest;
import com.nashetovreme.emotion.dto.EmotionResponse;
import com.nashetovreme.family.Family;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class EmotionService {

    private final EmotionRepository emotionRepository;
    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;

    @Transactional
    public EmotionResponse createEmotion(CreateEmotionRequest request, AuthenticatedUser principal) {
        verifyFamilyAccess(request.familyId(), principal);

        Family family = familyRepository.findById(request.familyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));

        User author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        EmotionEntry entry = new EmotionEntry();
        entry.setFamily(family);
        entry.setAuthor(author);
        entry.setEmotionType(request.emotionType().trim().toUpperCase());
        entry.setHappenedNote(trimToNull(request.happenedNote()));
        entry.setHelpedNote(trimToNull(request.helpedNote()));
        entry.setNeedsNote(trimToNull(request.needsNote()));
        entry.setWantToTalk(request.wantToTalk());

        return toResponse(emotionRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public List<EmotionResponse> getFamilyEmotions(Long familyId, AuthenticatedUser principal) {
        Long resolvedFamilyId = familyId != null ? familyId : principal.getFamilyId();
        if (resolvedFamilyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Family id is required");
        }
        verifyFamilyAccess(resolvedFamilyId, principal);
        return emotionRepository.findByFamilyIdOrderByCreatedAtDesc(resolvedFamilyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }

    private EmotionResponse toResponse(EmotionEntry entry) {
        User author = entry.getAuthor();
        String authorName = author == null ? null : (author.getFirstName() + " " + author.getLastName()).trim();
        return new EmotionResponse(
                entry.getId(),
                entry.getFamily().getId(),
                author == null ? null : author.getId(),
                authorName,
                entry.getEmotionType(),
                entry.getHappenedNote(),
                entry.getHelpedNote(),
                entry.getNeedsNote(),
                entry.isWantToTalk(),
                entry.getCreatedAt()
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

