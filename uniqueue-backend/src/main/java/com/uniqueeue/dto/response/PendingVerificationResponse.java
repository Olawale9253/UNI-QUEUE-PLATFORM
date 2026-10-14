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

    public static PendingVerificationResponse from(User user) {
        if (user == null) return null;
        return PendingVerificationResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .matricNumber(user.getMatricNumber())
                .jambRegNumber(user.getJambRegNumber())
                .admissionRef(user.getAdmissionRef())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .registrationStatus(user.getRegistrationStatus() != null
                        ? user.getRegistrationStatus().name() : null)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}