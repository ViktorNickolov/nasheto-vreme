package com.nashetovreme.shared.timeline;

import com.nashetovreme.moment.Moment;
import com.nashetovreme.moment.MomentRepository;
import com.nashetovreme.question.QuestionAnswer;
import com.nashetovreme.question.QuestionAnswerRepository;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.audit.AuditEventLogger;
import com.nashetovreme.shared.timeline.dto.TimelineItemResponse;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import java.util.ArrayList;
import java.util.Comparator;
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
public class TimelineService {

    private final MomentRepository momentRepository;
    private final QuestionAnswerRepository questionAnswerRepository;
    private final AuditEventLogger auditEventLogger;
    private final UserRepository userRepository;

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
            Map<Long, User> usersById = userRepository.findAllById(moments.stream()
                            .map(Moment::getCreatedByUserId)
                            .filter(id -> id != null)
                            .distinct()
                            .toList())
                    .stream()
                    .collect(java.util.stream.Collectors.toMap(User::getId, Function.identity()));
            moments.forEach(moment -> items.add(new TimelineItemResponse(
                    "MOMENT",
                    moment.getId(),
                    moment.getTitle(),
                    moment.getDescription(),
                    moment.getImageUrl(),
                    moment.getCreatedByUserId(),
                    resolveAuthorName(usersById.get(moment.getCreatedByUserId())),
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
                    null,
                    answer.getAuthor().getId(),
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
            auditEventLogger.familyAccessDenied(
                    "timeline",
                    principal.getId(),
                    principal.getFamilyId(),
                    requestedFamilyId
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }

    private static String resolveAuthorName(User user) {
        if (user == null) {
            return null;
        }
        return (user.getFirstName() + " " + user.getLastName()).trim();
    }
}

