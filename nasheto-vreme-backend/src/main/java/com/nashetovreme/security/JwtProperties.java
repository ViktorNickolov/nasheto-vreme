package com.nashetovreme.security;

import io.jsonwebtoken.io.Decoders;
import java.time.Duration;
import org.springframework.util.StringUtils;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String secret;
    private Duration accessTokenTtl = Duration.ofMinutes(15);
    private Duration refreshTokenTtl = Duration.ofDays(7);

    @PostConstruct
    void validate() {
        if (!StringUtils.hasText(secret)) {
            throw new IllegalStateException("app.jwt.secret must be configured");
        }

        byte[] secretBytes;
        try {
            secretBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("app.jwt.secret must be Base64-encoded", ex);
        }

        if (secretBytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret must decode to at least 32 bytes");
        }
    }
}


