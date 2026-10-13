package com.uniqueeue.dto.response;

import com.uniqueeue.model.User;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PendingVerificationResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String matricNumber;
    private String jambRegNumber;
    private String admissionRef;
    private String department;
    private String phone;
    private String registrationStatus;
    private String createdAt;

    public static PendingVerificationResponse from(User u) {
        if (u == null) return null;
        return PendingVerificationResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole() != null ? u.getRole().name() : null)
                .matricNumber(u.getMatricNumber())
                .jambRegNumber(u.getJambRegNumber())
                .admissionRef(u.getAdmissionRef())
                .department(u.getDepartment())
                .phone(u.getPhone())
                .registrationStatus(u.getRegistrationStatus() != null
                        ? u.getRegistrationStatus().name() : null)
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null)
                .build();
    }
}