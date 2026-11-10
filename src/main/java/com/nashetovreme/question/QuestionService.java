package com.nashetovreme.question;

import com.nashetovreme.family.Family;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.question.dto.CreateQuestionAnswerRequest;
import com.nashetovreme.question.dto.CreateQuestionRequest;
import com.nashetovreme.question.dto.QuestionAnswerResponse;
import com.nashetovreme.question.dto.QuestionResponse;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import com.nashetovreme.user.UserRole;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionAnswerRepository questionAnswerRepository;
    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions() {
        return questionRepository.findAll().stream()
                .map(this::toQuestionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionResponse getTodayQuestion() {
        List<Question> activeQuestions = questionRepository.findByActiveTrueOrderByIdAsc();
        if (activeQuestions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No active questions found");
        }

        int index = LocalDate.now().getDayOfYear() % activeQuestions.size();
        return toQuestionResponse(activeQuestions.get(index));
    }

    @Transactional
    public QuestionResponse createQuestion(CreateQuestionRequest request, AuthenticatedUser principal) {
        User author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (author.getRole() != UserRole.PARENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only parents can create questions");
        }

        Question question = new Question();
        question.setTitle(request.title().trim());
        question.setCategory(request.category().trim());
        question.setActive(request.active());

        return toQuestionResponse(questionRepository.save(question));
    }

    @Transactional
    public QuestionAnswerResponse answerQuestion(Long questionId,
                                                 CreateQuestionAnswerRequest request,
                                                 AuthenticatedUser principal) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Question not found"));
        Family family = familyRepository.findById(request.familyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));
        User author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        QuestionAnswer answer = new QuestionAnswer();
        answer.setQuestion(question);
        answer.setFamily(family);
        answer.setAuthor(author);
        answer.setAnswerText(request.answerText().trim());

        return toAnswerResponse(questionAnswerRepository.save(answer));
    }

    @Transactional(readOnly = true)
    public List<QuestionAnswerResponse> getFamilyAnswers(Long familyId) {
        if (!familyRepository.existsById(familyId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found");
        }

        return questionAnswerRepository.findByFamilyIdOrderByCreatedAtDesc(familyId).stream()
                .map(this::toAnswerResponse)
                .toList();
    }

    private QuestionResponse toQuestionResponse(Question question) {
        return new QuestionResponse(
                question.getId(),
                question.getTitle(),
                question.getCategory(),
                question.isActive(),
                question.getCreatedAt()
        );
    }

    private QuestionAnswerResponse toAnswerResponse(QuestionAnswer answer) {
        User author = answer.getAuthor();
        return new QuestionAnswerResponse(
                answer.getId(),
                answer.getQuestion().getId(),
                answer.getQuestion().getTitle(),
                answer.getFamily().getId(),
                author.getId(),
                author.getFirstName() + " " + author.getLastName(),
                answer.getAnswerText(),
                answer.getCreatedAt()
        );
    }
}

