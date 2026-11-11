package com.nashetovreme.shared.timeline;

import com.nashetovreme.moment.Moment;
import com.nashetovreme.moment.MomentRepository;
import com.nashetovreme.question.QuestionAnswer;
import com.nashetovreme.question.QuestionAnswerRepository;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.timeline.dto.TimelineItemResponse;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private final MomentRepository momentRepository;
    private final QuestionAnswerRepository questionAnswerRepository;

    @Transactional(readOnly = true)
    public List<TimelineItemResponse> getTimeline(Long familyId,
                                                  String type,
                                                  int limit,
                                                  AuthenticatedUser principal) {
        Long resolvedFamilyId = familyId != null ? familyId : principal.getFamilyId();
        if (resolvedFamilyId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Family id is required");
        }

        verifyFamilyAccess(resolvedFamilyId, principal);

        List<TimelineItemResponse> items = new ArrayList<>();

        if (!"ANSWER".equalsIgnoreCase(type)) {
            List<Moment> moments = momentRepository.findByFamilyIdOrderByCreatedAtDesc(resolvedFamilyId);
            moments.forEach(moment -> items.add(new TimelineItemResponse(
                    "MOMENT",
                    moment.getId(),
                    moment.getTitle(),
                    moment.getDescription(),
                    null,
                    moment.getCreatedAt()
            )));
        }

        if (!"MOMENT".equalsIgnoreCase(type)) {
            List<QuestionAnswer> answers = questionAnswerRepository.findByFamilyIdOrderByCreatedAtDesc(resolvedFamilyId);
            answers.forEach(answer -> items.add(new TimelineItemResponse(
                    "ANSWER",
                    answer.getId(),
                    answer.getQuestion().getTitle(),
                    answer.getAnswerText(),
                    answer.getAuthor().getFirstName() + " " + answer.getAuthor().getLastName(),
                    answer.getCreatedAt()
            )));
        }

        return items.stream()
                .sorted(Comparator.comparing(TimelineItemResponse::createdAt).reversed())
                .limit(Math.max(limit, 1))
                .toList();
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }
}

