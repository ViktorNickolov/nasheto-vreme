package com.nashetovreme.security;

import com.nashetovreme.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String ACCESS_TYPE = "access";
    private static final String REFRESH_TYPE = "refresh";

    private final JwtProperties jwtProperties;

    public JwtToken issueAccessToken(User user) {
        return issueToken(user, ACCESS_TYPE, jwtProperties.getAccessTokenTtl());
    }

    public JwtToken issueRefreshToken(User user) {
        return issueToken(user, REFRESH_TYPE, jwtProperties.getRefreshTokenTtl());
    }

    private JwtToken issueToken(User user, String tokenType, java.time.Duration ttl) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(ttl);

        String token = Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .claim("typ", tokenType)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(getSigningKey())
                .compact();

        return new JwtToken(token, expiresAt);
    }

    public String extractSubject(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isAccessTokenValid(String token, String username) {
        Claims claims = parseClaims(token);
        return username.equals(claims.getSubject())
                && ACCESS_TYPE.equals(claims.get("typ", String.class))
                && claims.getExpiration().after(new Date());
    }

    public boolean isRefreshTokenValid(String token, String username) {
        Claims claims = parseClaims(token);
        return username.equals(claims.getSubject())
                && REFRESH_TYPE.equals(claims.get("typ", String.class))
                && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtProperties.getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public record JwtToken(String value, Instant expiresAt) {
    }
}


