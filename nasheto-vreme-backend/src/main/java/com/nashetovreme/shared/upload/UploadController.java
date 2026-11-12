package com.nashetovreme.shared.upload;

import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.audit.AuditEventLogger;
import com.nashetovreme.shared.upload.dto.UploadImageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;
    private final AuditEventLogger auditEventLogger;

    @PostMapping("/images")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadImageResponse uploadImage(@RequestParam Long familyId,
                                           @RequestParam("file") MultipartFile file,
                                           @org.springframework.security.core.annotation.AuthenticationPrincipal
                                           AuthenticatedUser user) {
        if (user.getFamilyId() == null || !user.getFamilyId().equals(familyId)) {
            auditEventLogger.uploadDenied(
                    user.getId(),
                    user.getFamilyId(),
                    familyId,
                    file != null ? file.getOriginalFilename() : null,
                    file != null ? file.getSize() : 0
            );
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }
        UploadImageResponse response = uploadService.storeImage(file);
        auditEventLogger.uploadAccepted(
                user.getId(),
                familyId,
                file != null ? file.getOriginalFilename() : null,
                file != null ? file.getSize() : 0
        );
        return response;
    }
}

