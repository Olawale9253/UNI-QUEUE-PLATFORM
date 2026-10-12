package com.uniqueeue.dto.response;

import com.uniqueeue.model.User;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPrefsResponse {

    private Boolean soundEnabled;
    private Boolean pushEnabled;
    private Boolean ticketEmailsEnabled;

    public static NotificationPrefsResponse from(User user) {
        return NotificationPrefsResponse.builder()
                .soundEnabled(!Boolean.FALSE.equals(user.getSoundEnabled()))
                .pushEnabled(!Boolean.FALSE.equals(user.getPushEnabled()))
                .ticketEmailsEnabled(!Boolean.FALSE.equals(user.getTicketEmailsEnabled()))
                .build();
    }
}