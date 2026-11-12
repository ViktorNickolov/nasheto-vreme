package com.nashetovreme.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.auth.refresh-cookie")
public class RefreshTokenCookieProperties {

    private String name = "nv_refresh_token";
    private String path = "/api/v1/auth";
    private String sameSite = "Lax";
    private boolean secure;
}
