package com.uniqueeue.dto.response;

import com.uniqueeue.model.User;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileResponse {

    private Long id;
    private String email;
    private String recoveryEmail;
    private String fullName;
    private String role;

    private Long universityId;
    private String universityName;
    private String universityCode;
    private String universityLogoUrl;
    private String universityPrimaryColor;

    private Boolean featureWaitlist;
    private Boolean featureAppointments;
    private Boolean featureWorkflows;
    private Boolean featureDocuments;

    private String matricNumber;
    private String department;
    private String phone;
    private Boolean isActive;
    private Boolean isVerified;
    private LocalDateTime createdAt;

    // Fresher fields
    private String jambRegNumber;
    private String admissionRef;
    private String applicationNumber;
    private Boolean isFresher;
    private Boolean canUpgrade;
    private String matricPatternHint;
    private String matricExample;

    public static ProfileResponse from(User userValue4) {
        var uni = userValue4.getUniversity();
        boolean isFresher = userValue4.getRole() != null
                && "FRESHER".equalsIgnoreCase(userValue4.getRole().name());
        boolean canUpgrade = isFresher && uni != null;

        return ProfileResponse.builder()
                .id(userValue4.getId())
                .email(userValue4.getEmail())
                .recoveryEmail(userValue4.getRecoveryEmail())
                .fullName(userValue4.getFullName())
                .role(userValue4.getRole() != null ? userValue4.getRole().name() : null)
                .universityId(uni != null ? uni.getId() : null)
                .universityName(uni != null ? uni.getName() : null)
                .universityCode(uni != null ? uni.getCode() : null)
                .universityLogoUrl(uni != null ? uni.getLogoUrl() : null)
                .universityPrimaryColor(uni != null ? uni.getPrimaryColor() : null)
                .featureWaitlist(uni != null ? uni.getFeatureWaitlist() : null)
                .featureAppointments(uni != null ? uni.getFeatureAppointments() : null)
                .featureWorkflows(uni != null ? uni.getFeatureWorkflows() : null)
                .featureDocuments(uni != null ? uni.getFeatureDocuments() : null)
                .matricNumber(userValue4.getMatricNumber())
                .department(userValue4.getDepartment())
                .phone(userValue4.getPhone())
                .isActive(userValue4.getIsActive())
                .isVerified(userValue4.getIsVerified())
                .createdAt(userValue4.getCreatedAt())
                .jambRegNumber(userValue4.getJambRegNumber())
                .admissionRef(userValue4.getAdmissionRef())
                .applicationNumber(userValue4.getApplicationNumber())
                .isFresher(isFresher)
                .canUpgrade(canUpgrade)
                .matricPatternHint(uni != null ? uni.getMatricDescription() : null)
                .matricExample(uni != null ? uni.getMatricExample() : null)
                .build();
    }
}