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

    public static UniversityResponse from(University u) {
        if (u == null) return null;
        return UniversityResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .code(u.getCode())
                .emailDomain(u.getEmailDomain())
                .matricPattern(u.getMatricPattern())
                .matricExample(u.getMatricExample())
                .matricDescription(u.getMatricDescription())
                .matricVerificationMode(u.getMatricVerificationMode())
                .logoUrl(u.getLogoUrl())
                .campusImageUrl(u.getCampusImageUrl())
                .tagline(u.getTagline())
                .primaryColor(u.getPrimaryColor())
                .timezone(u.getTimezone())
                .countryCode(u.getCountryCode())
                .maxStaff(u.getMaxStaff())
                .maxQueues(u.getMaxQueues())
                .maxTicketsPerDay(u.getMaxTicketsPerDay())
                .isActive(u.getIsActive())
                .plan(u.getPlan())
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
                // Stats are left null here — UniversityService sets them after mapping.
                .build();
    }
}