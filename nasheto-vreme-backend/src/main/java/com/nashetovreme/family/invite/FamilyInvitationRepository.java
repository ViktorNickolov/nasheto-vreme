package com.nashetovreme.family.invite;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyInvitationRepository extends JpaRepository<FamilyInvitation, Long> {

    Optional<FamilyInvitation> findByToken(String token);
}

