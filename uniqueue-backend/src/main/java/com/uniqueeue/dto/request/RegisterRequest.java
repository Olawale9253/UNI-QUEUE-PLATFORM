package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.stream.Collectors;
import java.util.stream.Stream;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String fullName;

    private String firstName;
    private String middleName;
    private String lastName;

    public String getSubmittedFullName() {
        boolean hasSeparateName = Stream.of(firstName, middleName, lastName)
                .anyMatch(value -> value != null && !value.isBlank());
        if (!hasSeparateName) return fullName;
        if (firstName == null || firstName.isBlank() || lastName == null || lastName.isBlank()) {
            return null;
        }
        return Stream.of(firstName, middleName, lastName)
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(" "));
    }

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