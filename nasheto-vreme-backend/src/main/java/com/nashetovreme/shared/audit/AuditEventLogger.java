package com.nashetovreme.shared.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AuditEventLogger {

    private static final Logger log = LoggerFactory.getLogger(AuditEventLogger.class);

    public void authSuccess(String action, Long userId, Long familyId, String email, String clientIp) {
        log.info("audit_event=auth_success action={} user_id={} family_id={} email={} client_ip={}",
                action, userId, familyId, email, clientIp);
    }

    public void authFailure(String action, String email, String reason) {
        log.warn("audit_event=auth_failure action={} email={} reason={}", action, email, reason);
    }

    public void authLogout(String clientIp) {
        log.info("audit_event=auth_logout client_ip={}", clientIp);
    }

    public void familyAccessDenied(String area, Long userId, Long principalFamilyId, Long requestedFamilyId) {
        log.warn("audit_event=family_access_denied area={} user_id={} principal_family_id={} requested_family_id={}",
                area, userId, principalFamilyId, requestedFamilyId);
    }

    public void uploadAccepted(Long userId, Long familyId, String fileName, long sizeBytes) {
        log.info("audit_event=upload_accepted user_id={} family_id={} file_name={} size_bytes={}",
                userId, familyId, sanitizeFileName(fileName), sizeBytes);
    }

    public void uploadDenied(Long userId, Long principalFamilyId, Long requestedFamilyId, String fileName, long sizeBytes) {
        log.warn("audit_event=upload_denied user_id={} principal_family_id={} requested_family_id={} file_name={} size_bytes={}",
                userId, principalFamilyId, requestedFamilyId, sanitizeFileName(fileName), sizeBytes);
    }

    private static String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "unknown";
        }
        return fileName.replaceAll("[\\r\\n\\t]", "_");
    }
}

