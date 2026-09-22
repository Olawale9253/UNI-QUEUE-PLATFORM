package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateProfileRequest {

    @Size(max = 255)
    private String fullName;

    @Size(max = 100)
    private String department;

    @Size(max = 20)
    private String phone;

    /**
     * Only set by freshers who received their matric and want to upgrade
     * to full USER access. Ignored for other roles.
     */
    @Size(max = 50)
    private String matricNumber;
}