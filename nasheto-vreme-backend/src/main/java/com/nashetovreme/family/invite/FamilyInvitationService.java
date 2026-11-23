package com.nashetovreme.family.invite;

import com.nashetovreme.family.Family;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.family.invite.dto.CreateFamilyInvitationRequest;
import com.nashetovreme.family.invite.dto.FamilyInvitationResponse;
import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.audit.AuditEventLogger;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import com.nashetovreme.user.UserRole;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class FamilyInvitationService {

    private static final Logger log = LoggerFactory.getLogger(FamilyInvitationService.class);

    private final FamilyInvitationRepository familyInvitationRepository;
    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;
    private final InviteMailProperties inviteMailProperties;
    private final FamilyInviteEmailService familyInviteEmailService;
    private final AuditEventLogger auditEventLogger;

    @Transactional
    public FamilyInvitationResponse createInvitation(Long familyId,
                                                     CreateFamilyInvitationRequest request,
                                                     AuthenticatedUser principal) {
        verifyFamilyAccess(familyId, principal);

        User actor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (actor.getRole() != UserRole.PARENT) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only parents can send invitations");
        }

        String normalizedEmail = normalizeEmail(request.email());
        Family family = familyRepository.findById(familyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));

        Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);
        existingUser.ifPresent(user -> {
            if (user.getFamily() != null && user.getFamily().getId().equals(familyId)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User already belongs to this family");
            }
        });

        if (existingUser
                .map(user -> user.getFamily() != null && !user.getFamily().getId().equals(familyId))
                .orElse(false)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User belongs to another family");
        }

        FamilyInvitation invitation = new FamilyInvitation();
        invitation.setFamily(family);
        invitation.setInvitedByUserId(actor.getId());
        invitation.setEmail(normalizedEmail);
        invitation.setRole(request.role());
        invitation.setToken(UUID.randomUUID().toString().replace("-", ""));
        invitation.setExpiresAt(Instant.now().plus(inviteMailProperties.getExpiresInHours(), ChronoUnit.HOURS));

        FamilyInvitation savedInvitation = familyInvitationRepository.save(invitation);
        String inviteLink = inviteMailProperties.buildAcceptUrl(savedInvitation.getToken(), normalizedEmail);
        String deliveryStatus = "NOT_SENT_DISABLED";
        String inviteSubject = FamilyInviteEmailService.buildInviteSubject();
        String inviteBody = FamilyInviteEmailService.buildInviteBody(
                family.getName(),
                request.role(),
                inviteLink,
                savedInvitation.getExpiresAt()
        );

        if (inviteMailProperties.isEnabled()) {
            try {
                familyInviteEmailService.sendInviteEmail(
                        normalizedEmail,
                        family.getName(),
                        request.role(),
                        inviteLink,
                        savedInvitation.getExpiresAt()
                );
                deliveryStatus = "SENT";
            } catch (MailException ex) {
                deliveryStatus = "SEND_FAILED";
                log.warn("invite_email_send_failed family_id={} email={} reason={}", familyId, normalizedEmail, ex.getMessage());
            }
        }

        log.info("invite_email_generated family_id={} email={} role={} status={} subject=\"{}\" body=\"{}\" link={} expires_at={}",
                familyId,
                normalizedEmail,
                request.role().name(),
                deliveryStatus,
                inviteSubject,
                inviteBody.replace("\n", "\\n"),
                inviteLink,
                savedInvitation.getExpiresAt());

        return new FamilyInvitationResponse(
                savedInvitation.getId(),
                savedInvitation.getEmail(),
                savedInvitation.getRole().name(),
                savedInvitation.getExpiresAt(),
                deliveryStatus,
                inviteLink
        );
    }

    @Transactional
    public FamilyInvitation consumeInvitationForRegistration(String token, String email) {
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invite token is required");
        }

        String normalizedEmail = normalizeEmail(email);
        FamilyInvitation invitation = familyInvitationRepository.findByToken(token.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        if (invitation.getAcceptedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invitation already used");
        }

        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitation expired");
        }

        if (!invitation.getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation email does not match");
        }

        invitation.setAcceptedAt(Instant.now());
        return familyInvitationRepository.save(invitation);
    }

    private void verifyFamilyAccess(Long requestedFamilyId, AuthenticatedUser principal) {
        if (principal.getFamilyId() == null || !principal.getFamilyId().equals(requestedFamilyId)) {
            auditEventLogger.familyAccessDenied(
                    "invite",
                    principal.getId(),
                    principal.getFamilyId(),
                    requestedFamilyId
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}


