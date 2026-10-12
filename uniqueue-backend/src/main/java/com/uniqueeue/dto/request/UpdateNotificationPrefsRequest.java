package com.uniqueeue.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateNotificationPrefsRequest {
    private Boolean soundEnabled;
    private Boolean pushEnabled;
    private Boolean ticketEmailsEnabled;
}