package com.nashetovreme.security;

import java.time.Duration;
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
}


