package com.nashetovreme.together;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TogetherActivityRepository extends JpaRepository<TogetherActivity, Long> {

    List<TogetherActivity> findByFamilyIdOrderByCreatedAtDesc(Long familyId);

    long countByFamilyId(Long familyId);

    long countByFamilyIdAndCreatedByUserId(Long familyId, Long createdByUserId);
}

