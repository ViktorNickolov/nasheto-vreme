package com.nashetovreme.privacy;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrivacyRequestRepository extends JpaRepository<PrivacyRequest, Long> {

    List<PrivacyRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
}

