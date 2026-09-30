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

    public static UniversityResponse from(University u) {
        return UniversityResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .code(u.getCode())
                .emailDomain(u.getEmailDomain())
                .matricPattern(u.getMatricPattern())
                .matricExample(u.getMatricExample())
                .matricDescription(u.getMatricDescription())
                .logoUrl(u.getLogoUrl())
                .campusImageUrl(u.getCampusImageUrl())
                .tagline(u.getTagline())
                .primaryColor(u.getPrimaryColor())
                // ⬇ NEW — fallback so old rows never serialize null
                .timezone(u.getTimezone() != null ? u.getTimezone() : "Africa/Lagos")
                .isActive(u.getIsActive())
                .plan(u.getPlan())
                .maxStaff(u.getMaxStaff())
                .maxQueues(u.getMaxQueues())
                .maxTicketsPerDay(u.getMaxTicketsPerDay())
                .featureWaitlist(u.getFeatureWaitlist())
                .featureAppointments(u.getFeatureAppointments())
                .featureWorkflows(u.getFeatureWorkflows())
                .featureDocuments(u.getFeatureDocuments())
                .fresherRegistrationEnabled(u.getFresherRegistrationEnabled())
                .fresherVerificationMode(u.getFresherVerificationMode())
                .requireJambReg(u.getRequireJambReg())
                .jambRegPattern(u.getJambRegPattern())
                .jambRegExample(u.getJambRegExample())
                .jambRegDescription(u.getJambRegDescription())
                .requireAdmissionRef(u.getRequireAdmissionRef())
                .admissionRefPattern(u.getAdmissionRefPattern())
                .admissionRefExample(u.getAdmissionRefExample())
                .admissionRefDescription(u.getAdmissionRefDescription())
                .requireApplicationNumber(u.getRequireApplicationNumber())
                .applicationNumberPattern(u.getApplicationNumberPattern())
                .applicationNumberExample(u.getApplicationNumberExample())
                .applicationNumberDescription(u.getApplicationNumberDescription())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}