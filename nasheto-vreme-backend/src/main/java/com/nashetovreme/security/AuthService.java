package com.nashetovreme.security;

import com.nashetovreme.family.Family;
import com.nashetovreme.family.FamilyMember;
import com.nashetovreme.family.FamilyMemberRepository;
import com.nashetovreme.family.FamilyRepository;
import com.nashetovreme.security.dto.AuthResponse;
import com.nashetovreme.security.dto.LoginRequest;
import com.nashetovreme.security.dto.RegisterRequest;
import com.nashetovreme.security.dto.UserProfileResponse;
import com.nashetovreme.user.User;
import com.nashetovreme.user.UserRepository;
import com.nashetovreme.user.UserRole;
import io.jsonwebtoken.JwtException;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        Family family = new Family();
        family.setName(request.familyName().trim());
        Family savedFamily = familyRepository.save(family);

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setRole(UserRole.PARENT);
        user.setFamily(savedFamily);

        User savedUser = userRepository.save(user);

        savedFamily.setCreatedBy(savedUser);
        familyRepository.save(savedFamily);

        FamilyMember ownerMembership = new FamilyMember();
        ownerMembership.setFamily(savedFamily);
        ownerMembership.setUser(savedUser);
        ownerMembership.setRole(UserRole.PARENT);
        ownerMembership.setJoinedAt(Instant.now());
        familyMemberRepository.save(ownerMembership);

        return issueAuthTokens(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> invalidCredentials());

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw invalidCredentials();
        }

        return issueAuthTokens(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)) {
            throw invalidCredentials();
        }

        String email;
        try {
            email = jwtService.extractSubject(refreshToken);
        } catch (JwtException ex) {
            throw invalidCredentials();
        }

        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(AuthService::invalidCredentials);

        if (!jwtService.isRefreshTokenValid(refreshToken, user.getEmail())) {
            throw invalidCredentials();
        }

        return issueAuthTokens(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toProfile(user);
    }

    private UserProfileResponse toProfile(User user) {
        Long familyId = user.getFamily() != null ? user.getFamily().getId() : null;
        String familyName = user.getFamily() != null ? user.getFamily().getName() : null;
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole().name(),
                familyId,
                familyName
        );
    }

    private AuthResponse issueAuthTokens(User user) {
        JwtService.JwtToken accessToken = jwtService.issueAccessToken(user);
        JwtService.JwtToken refreshToken = jwtService.issueRefreshToken(user);
        return new AuthResponse(
                accessToken.value(),
                accessToken.expiresAt(),
                refreshToken.value(),
                refreshToken.expiresAt(),
                toProfile(user)
        );
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}




