package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUniversitySettingsRequest {

    @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String emailDomain;

    private String matricPattern;

    @Size(max = 100)
    private String matricExample;

    private String matricDescription;

    // ─── Branding ───
    @Size(max = 500)
    private String logoUrl;

    @Size(max = 500)
    private String campusImageUrl;

    @Size(max = 255)
    private String tagline;

    @Size(max = 20)
    private String primaryColor;

    // ─── Limits ───
    @Min(value = 1, message = "Max staff must be at least 1")
    private Integer maxStaff;

    @Min(value = 1, message = "Max queues must be at least 1")
    private Integer maxQueues;

    // ─── Fresher registration ───
    private Boolean fresherRegistrationEnabled;

    @Size(max = 20)
    private String fresherVerificationMode; // PATTERN | LIST | BOTH

    private Boolean requireJambReg;
    private String jambRegPattern;
    private String jambRegExample;
    private String jambRegDescription;

    private Boolean requireAdmissionRef;
    private String admissionRefPattern;
    private String admissionRefExample;
    private String admissionRefDescription;

    private Boolean requireApplicationNumber;
    private String applicationNumberPattern;
    private String applicationNumberExample;
    private String applicationNumberDescription;
}