package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateUniversityRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;

    @NotBlank(message = "Code is required")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Admin email is required")
    @Email(message = "Admin email must be valid")
    private String adminEmail;

    @NotBlank(message = "Admin password is required")
    @Size(min = 8, message = "Admin password must be at least 8 characters")
    private String adminPassword;

    @NotBlank(message = "Admin full name is required")
    private String adminFullName;

    private String emailDomain;
    private String matricPattern;
    private String matricExample;
    private String matricDescription;

    // ─── Branding ───
    // logoUrl / campusImageUrl can be base64 data URLs (100 KB–1 MB images)
    // which inflate to ~1.4× the source size as characters. Cap generously.
    @Size(max = 2_000_000)
    private String logoUrl;

    @Size(max = 2_000_000)
    private String campusImageUrl;

    @Size(max = 255)
    private String tagline;

    @Size(max = 20)
    private String primaryColor;

    private String plan;
    private Integer maxStaff;
    private Integer maxQueues;
}