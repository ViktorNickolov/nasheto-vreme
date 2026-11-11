package com.nashetovreme.family;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {

    List<FamilyMember> findByFamilyId(Long familyId);

    boolean existsByFamilyIdAndUserId(Long familyId, Long userId);
}

