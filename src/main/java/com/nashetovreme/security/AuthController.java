package com.nashetovreme.security;

import com.nashetovreme.security.dto.AuthResponse;
import com.nashetovreme.security.dto.LoginRequest;
import com.nashetovreme.security.dto.RefreshTokenRequest;
import com.nashetovreme.security.dto.RegisterRequest;
import com.nashetovreme.security.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.getProfileByEmail(user.getUsername());
    }
}


