package com.nashetovreme.family.invite;

import com.nashetovreme.user.UserRole;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FamilyInviteEmailService {

    private final JavaMailSender mailSender;
    private final InviteMailProperties inviteMailProperties;

    public void sendInviteEmail(String recipientEmail,
                                String familyName,
                                UserRole invitedRole,
                                String inviteLink,
                                Instant expiresAt) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(inviteMailProperties.getSenderEmail());
        message.setTo(recipientEmail);
        message.setSubject(buildInviteSubject());
        message.setText(buildInviteBody(familyName, invitedRole, inviteLink, expiresAt));
        mailSender.send(message);
    }

    public static String buildInviteSubject() {
        return "Покана за семейство в Нашето време";
    }

    public static String buildInviteBody(String familyName, UserRole invitedRole, String inviteLink, Instant expiresAt) {
        String roleLabel = invitedRole == UserRole.CHILD ? "дете" : "родител";
        return "Здравейте,\n\n"
                + "Получихте покана за присъединяване към семейство \"" + familyName + "\" в Нашето време.\n"
                + "Роля: " + roleLabel + "\n"
                + "Линк за регистрация: " + inviteLink + "\n"
                + "Валидна до: " + expiresAt + "\n\n"
                + "Ако не очаквате тази покана, игнорирайте това писмо.";
    }
}

