package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    // ─── School identification ───
    // Registration accepts EITHER universityCode OR universityId.
    // AuthService.resolveUniversity() enforces that at least one is present.
    private String universityCode;
    private Long universityId;

    // ─── Continuing student (USER) ───
    private String matricNumber;
    private String department;
    private String phone;

    // ─── Fresher ───
    @Builder.Default
    private String accountType = "STUDENT";

    private String jambRegNumber;
    private String admissionRef;
    private String applicationNumber;
}