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

    @NotBlank(message = "University code is required")
    private String universityCode;

    // ─── Continuing student (USER) ───
    private String matricNumber;
    private String department;
    private String phone;

    // ─── Fresher ───

    private String accountType = "STUDENT";

    private String jambRegNumber;
    private String admissionRef;
    private String applicationNumber;
}