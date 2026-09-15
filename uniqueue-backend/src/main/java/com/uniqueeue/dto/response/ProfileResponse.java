package com.uniqueeue.dto.response;

import com.uniqueeue.model.User;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileResponse {

    private Long id;
    private String email;
    private String fullName;
    private String role;

    private Long universityId;
    private String universityName;
    private String universityCode;
    private String universityLogoUrl;
    private String universityPrimaryColor;

    // Feature flags (used by frontend to show/hide tabs)
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

    public static ProfileResponse from(User u) {
        var uni = u.getUniversity();
        return ProfileResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole() != null ? u.getRole().name() : null)
                .universityId(uni != null ? uni.getId() : null)
                .universityName(uni != null ? uni.getName() : null)
                .universityCode(uni != null ? uni.getCode() : null)
                .universityLogoUrl(uni != null ? uni.getLogoUrl() : null)
                .universityPrimaryColor(uni != null ? uni.getPrimaryColor() : null)
                .featureWaitlist(uni != null ? uni.getFeatureWaitlist() : null)
                .featureAppointments(uni != null ? uni.getFeatureAppointments() : null)
                .featureWorkflows(uni != null ? uni.getFeatureWorkflows() : null)
                .featureDocuments(uni != null ? uni.getFeatureDocuments() : null)
                .matricNumber(u.getMatricNumber())
                .department(u.getDepartment())
                .phone(u.getPhone())
                .isActive(u.getIsActive())
                .isVerified(u.getIsVerified())
                .createdAt(u.getCreatedAt())
                .build();
    }
}