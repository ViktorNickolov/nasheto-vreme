package com.nashetovreme.security;

import com.nashetovreme.security.dto.AuthResponse;
import com.nashetovreme.security.dto.LoginRequest;
import com.nashetovreme.security.dto.RefreshTokenRequest;
import com.nashetovreme.security.dto.RegisterRequest;
import com.nashetovreme.security.dto.UserProfileResponse;
import com.nashetovreme.shared.audit.AuditEventLogger;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenCookieProperties refreshTokenCookieProperties;
    private final AuditEventLogger auditEventLogger;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request,
                                 HttpServletRequest httpRequest,
                                 HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        writeRefreshCookie(response, authResponse);
        auditEventLogger.authSuccess(
                "register",
                authResponse.user().id(),
                authResponse.user().familyId(),
                authResponse.user().email(),
                resolveClientIp(httpRequest)
        );
        return sanitizeAuthResponse(authResponse);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                              HttpServletRequest httpRequest,
                              HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        writeRefreshCookie(response, authResponse);
        auditEventLogger.authSuccess(
                "login",
                authResponse.user().id(),
                authResponse.user().familyId(),
                authResponse.user().email(),
                resolveClientIp(httpRequest)
        );
        return sanitizeAuthResponse(authResponse);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody(required = false) RefreshTokenRequest request,
                                HttpServletRequest httpRequest,
                                HttpServletResponse response) {
        String refreshToken = resolveRefreshToken(httpRequest, request);
        AuthResponse authResponse = authService.refresh(refreshToken);
        writeRefreshCookie(response, authResponse);
        auditEventLogger.authSuccess(
                "refresh",
                authResponse.user().id(),
                authResponse.user().familyId(),
                authResponse.user().email(),
                resolveClientIp(httpRequest)
        );
        return sanitizeAuthResponse(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(refreshTokenCookieProperties.getName(), "")
                .httpOnly(true)
                .secure(refreshTokenCookieProperties.isSecure())
                .sameSite(refreshTokenCookieProperties.getSameSite())
                .path(refreshTokenCookieProperties.getPath())
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        auditEventLogger.authLogout(resolveClientIp(request));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return authService.getProfileByEmail(user.getUsername());
    }

    private void writeRefreshCookie(HttpServletResponse response, AuthResponse authResponse) {
        if (authResponse.refreshToken() == null || authResponse.refreshTokenExpiresAt() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Refresh token was not issued");
        }

        Duration cookieAge = Duration.between(java.time.Instant.now(), authResponse.refreshTokenExpiresAt());
        if (cookieAge.isNegative()) {
            cookieAge = Duration.ZERO;
        }

        ResponseCookie cookie = ResponseCookie.from(refreshTokenCookieProperties.getName(), authResponse.refreshToken())
                .httpOnly(true)
                .secure(refreshTokenCookieProperties.isSecure())
                .sameSite(refreshTokenCookieProperties.getSameSite())
                .path(refreshTokenCookieProperties.getPath())
                .maxAge(cookieAge)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String resolveRefreshToken(HttpServletRequest request, RefreshTokenRequest body) {
        Cookie cookie = WebUtils.getCookie(request, refreshTokenCookieProperties.getName());
        if (cookie != null && cookie.getValue() != null && !cookie.getValue().isBlank()) {
            return cookie.getValue();
        }
        return body != null ? body.refreshToken() : null;
    }

    private static AuthResponse sanitizeAuthResponse(AuthResponse authResponse) {
        return new AuthResponse(
                authResponse.accessToken(),
                authResponse.accessTokenExpiresAt(),
                null,
                null,
                authResponse.user()
        );
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}


