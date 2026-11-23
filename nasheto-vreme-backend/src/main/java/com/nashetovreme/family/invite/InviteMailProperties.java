package com.nashetovreme.family.invite;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.invites")
public class InviteMailProperties {

    private boolean enabled;
    private int expiresInHours = 72;
    private String senderEmail = "no-reply@nasheto-vreme.local";
    private String senderName = "Nasheto Vreme";
    private String acceptUrlTemplate = "http://localhost:5173/?inviteToken={token}&inviteEmail={email}";

    public String buildAcceptUrl(String token, String email) {
        String safeToken = urlEncode(token);
        String safeEmail = urlEncode(email);
        return acceptUrlTemplate
                .replace("{token}", safeToken)
                .replace("{email}", safeEmail);
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}

