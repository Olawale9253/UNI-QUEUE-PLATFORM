package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmitUniversityApplicationRequest {
    @NotBlank(message = "University name is required")
    @Size(max = 255)
    private String universityName;

    @NotBlank(message = "University code is required")
    @Size(max = 50)
    private String universityCode;

    @Size(max = 100)
    private String emailDomain;

    @NotBlank(message = "Your full name is required")
    private String adminFullName;

    @NotBlank(message = "Your email is required")
    @Email(message = "Email must be valid")
    private String adminEmail;

    @Size(max = 20)
    private String adminPhone;

    @Size(max = 100)
    private String adminRole;

    @Size(max = 1000)
    private String message;
}