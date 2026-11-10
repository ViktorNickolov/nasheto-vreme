package com.nashetovreme.shared.upload;

import com.nashetovreme.security.AuthenticatedUser;
import com.nashetovreme.shared.upload.dto.UploadImageResponse;
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
public class UploadController {

    private final UploadService uploadService;

    public UploadController(UploadService uploadService) {
        this.uploadService = uploadService;
    }

    @PostMapping("/images")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadImageResponse uploadImage(@RequestParam Long familyId,
                                           @RequestParam("file") MultipartFile file,
                                           @org.springframework.security.core.annotation.AuthenticationPrincipal
                                           AuthenticatedUser user) {
        if (user.getFamilyId() == null || !user.getFamilyId().equals(familyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied for this family");
        }

        return uploadService.storeImage(file);
    }
}

