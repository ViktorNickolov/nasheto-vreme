package com.nashetovreme.moment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MomentRepository extends JpaRepository<Moment, Long> {

	List<Moment> findByFamilyIdOrderByCreatedAtDesc(Long familyId);
}

