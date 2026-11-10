package com.nashetovreme.question;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionAnswerRepository extends JpaRepository<QuestionAnswer, Long> {

    List<QuestionAnswer> findByFamilyIdOrderByCreatedAtDesc(Long familyId);
}

