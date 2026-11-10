package com.nashetovreme.question;

import com.nashetovreme.question.dto.CreateQuestionAnswerRequest;
import com.nashetovreme.question.dto.CreateQuestionRequest;
import com.nashetovreme.question.dto.QuestionAnswerResponse;
import com.nashetovreme.question.dto.QuestionResponse;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/questions/today")
    public QuestionResponse getTodayQuestion() {
        return questionService.getTodayQuestion();
    }

    @GetMapping("/questions")
    public List<QuestionResponse> getQuestions() {
        return questionService.getQuestions();
    }

    @PostMapping("/questions")
    public QuestionResponse createQuestion(@Valid @RequestBody CreateQuestionRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser user) {
        return questionService.createQuestion(request, user);
    }

    @PostMapping("/questions/{id}/answers")
    public QuestionAnswerResponse answerQuestion(@PathVariable Long id,
                                                 @Valid @RequestBody CreateQuestionAnswerRequest request,
                                                 @AuthenticationPrincipal AuthenticatedUser user) {
        return questionService.answerQuestion(id, request, user);
    }

    @GetMapping("/families/{id}/answers")
    public List<QuestionAnswerResponse> getFamilyAnswers(@PathVariable Long id) {
        return questionService.getFamilyAnswers(id);
    }
}

