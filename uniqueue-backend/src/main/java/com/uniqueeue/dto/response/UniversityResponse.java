package com.uniqueeue.dto.response;

import com.uniqueeue.model.University;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UniversityResponse {

    private Long id;
    private String name;
    private String code;
    private String emailDomain;

    // Matric config
    private String matricPattern;
    private String matricExample;
    private String matricDescription;
    private String matricVerificationMode;

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
    private Integer maxTicketsPerDay;

    // Status
    private Boolean isActive;
    private String plan;

    // Feature flags
    private Boolean featureWaitlist;
    private Boolean featureAppointments;
    private Boolean featureWorkflows;
    private Boolean featureDocuments;

    // Fresher config
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

    // ─── Stats (populated by UniversityService for super-admin views) ───
    private Long queueCount;
    private Long staffCount;
    private Long userCount;
    private Long ticketCount;

    public static UniversityResponse from(University university) {
        if (university == null) return null;
        return UniversityResponse.builder()
                .id(university.getId())
                .name(university.getName())
                .code(university.getCode())
                .emailDomain(university.getEmailDomain())
                .matricPattern(university.getMatricPattern())
                .matricExample(university.getMatricExample())
                .matricDescription(university.getMatricDescription())
                .matricVerificationMode(university.getMatricVerificationMode())
                .logoUrl(university.getLogoUrl())
                .campusImageUrl(university.getCampusImageUrl())
                .tagline(university.getTagline())
                .primaryColor(university.getPrimaryColor())
                .timezone(university.getTimezone())
                .countryCode(university.getCountryCode())
                .maxStaff(university.getMaxStaff())
                .maxQueues(university.getMaxQueues())
                .maxTicketsPerDay(university.getMaxTicketsPerDay())
                .isActive(university.getIsActive())
                .plan(university.getPlan())
                .featureWaitlist(university.getFeatureWaitlist())
                .featureAppointments(university.getFeatureAppointments())
                .featureWorkflows(university.getFeatureWorkflows())
                .featureDocuments(university.getFeatureDocuments())
                .fresherRegistrationEnabled(university.getFresherRegistrationEnabled())
                .fresherVerificationMode(university.getFresherVerificationMode())
                .requireJambReg(university.getRequireJambReg())
                .jambRegPattern(university.getJambRegPattern())
                .jambRegExample(university.getJambRegExample())
                .jambRegDescription(university.getJambRegDescription())
                .requireAdmissionRef(university.getRequireAdmissionRef())
                .admissionRefPattern(university.getAdmissionRefPattern())
                .admissionRefExample(university.getAdmissionRefExample())
                .admissionRefDescription(university.getAdmissionRefDescription())
                .requireApplicationNumber(university.getRequireApplicationNumber())
                .applicationNumberPattern(university.getApplicationNumberPattern())
                .applicationNumberExample(university.getApplicationNumberExample())
                .applicationNumberDescription(university.getApplicationNumberDescription())
                // Stats are left null here — UniversityService sets them after mapping.
                .build();
    }
}