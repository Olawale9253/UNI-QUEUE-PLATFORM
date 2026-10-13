package com.uniqueeue.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUniversitySettingsRequest {

    // Identity
    private String name;
    private String emailDomain;
    private String matricPattern;
    private String matricExample;
    private String matricDescription;
    private String matricVerificationMode;   // NEW

    // Branding
    private String logoUrl;
    private String campusImageUrl;
    private String tagline;
    private String primaryColor;

    // Schedule
    private String timezone;
    private String countryCode;

    // Limits
    private Integer maxStaff;
    private Integer maxQueues;

    // Fresher registration
    private Boolean fresherRegistrationEnabled;
    private String fresherVerificationMode;

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