package com.nashetovreme.emotion;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmotionRepository extends JpaRepository<EmotionEntry, Long> {

    List<EmotionEntry> findByFamilyIdOrderByCreatedAtDesc(Long familyId);

    long countByFamilyId(Long familyId);

    long countByFamilyIdAndAuthorId(Long familyId, Long authorId);
}

