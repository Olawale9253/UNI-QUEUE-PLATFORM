package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniqueeue.model.University;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UniversityResponse {

    private Long id;
    private String name;
    private String code;
    private String emailDomain;
    private String matricPattern;
    private String matricExample;
    private String matricDescription;
    private String logoUrl;
    private String campusImageUrl;
    private String tagline;
    private String primaryColor;

    // ⬇ NEW
    private String timezone;
    private String countryCode;

    @JsonProperty("isActive")
    private Boolean isActive;

    private String plan;
    private Integer maxStaff;
    private Integer maxQueues;
    private Integer maxTicketsPerDay;

    // Feature flags
    private Boolean featureWaitlist;
    private Boolean featureAppointments;
    private Boolean featureWorkflows;
    private Boolean featureDocuments;

    // Fresher registration config
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

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Live counters
    private Long queueCount;
    private Long staffCount;
    private Long userCount;
    private Long ticketCount;

    public static UniversityResponse from(University universityValue6) {
        return UniversityResponse.builder()
                .id(universityValue6.getId())
                .name(universityValue6.getName())
                .code(universityValue6.getCode())
                .emailDomain(universityValue6.getEmailDomain())
                .matricPattern(universityValue6.getMatricPattern())
                .matricExample(universityValue6.getMatricExample())
                .matricDescription(universityValue6.getMatricDescription())
                .logoUrl(universityValue6.getLogoUrl())
                .campusImageUrl(universityValue6.getCampusImageUrl())
                .tagline(universityValue6.getTagline())
                .primaryColor(universityValue6.getPrimaryColor())
                // ⬇ NEW — fallback so old rows never serialize null
                .timezone(universityValue6.getTimezone() != null ? universityValue6.getTimezone() : "Africa/Lagos")
                .isActive(universityValue6.getIsActive())
                .plan(universityValue6.getPlan())
                .maxStaff(universityValue6.getMaxStaff())
                .maxQueues(universityValue6.getMaxQueues())
                .maxTicketsPerDay(universityValue6.getMaxTicketsPerDay())
                .featureWaitlist(universityValue6.getFeatureWaitlist())
                .featureAppointments(universityValue6.getFeatureAppointments())
                .featureWorkflows(universityValue6.getFeatureWorkflows())
                .featureDocuments(universityValue6.getFeatureDocuments())
                .fresherRegistrationEnabled(universityValue6.getFresherRegistrationEnabled())
                .fresherVerificationMode(universityValue6.getFresherVerificationMode())
                .requireJambReg(universityValue6.getRequireJambReg())
                .jambRegPattern(universityValue6.getJambRegPattern())
                .jambRegExample(universityValue6.getJambRegExample())
                .jambRegDescription(universityValue6.getJambRegDescription())
                .requireAdmissionRef(universityValue6.getRequireAdmissionRef())
                .admissionRefPattern(universityValue6.getAdmissionRefPattern())
                .admissionRefExample(universityValue6.getAdmissionRefExample())
                .admissionRefDescription(universityValue6.getAdmissionRefDescription())
                .requireApplicationNumber(universityValue6.getRequireApplicationNumber())
                .applicationNumberPattern(universityValue6.getApplicationNumberPattern())
                .applicationNumberExample(universityValue6.getApplicationNumberExample())
                .applicationNumberDescription(universityValue6.getApplicationNumberDescription())
                .createdAt(universityValue6.getCreatedAt())
                .updatedAt(universityValue6.getUpdatedAt())
                .build();
    }
}