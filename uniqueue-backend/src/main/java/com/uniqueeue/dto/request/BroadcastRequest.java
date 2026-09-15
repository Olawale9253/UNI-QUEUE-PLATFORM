package com.uniqueeue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BroadcastRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotBlank(message = "Message is required")
    @Size(max = 2000)
    private String message;

    /**
     * Optional. If null, broadcasts to everyone on the platform.
     * If set, only users of that university receive it.
     */
    private Long universityId;

    /**
     * Optional. Filter recipients by role. If null, sends to all roles.
     * Accepted: SUPER_ADMIN, ADMIN, STAFF, USER
     */
    private String role;
}