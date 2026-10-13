package com.uniqueeue.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniqueeue.model.User;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GlobalUserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String matricNumber;
    private String department;
    private String phone;

    private Long universityId;
    private String universityName;
    private String universityCode;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("isVerified")
    private Boolean isVerified;

    private String registrationStatus;   // ⬅ NEW: "PENDING" | "VERIFIED" | "REJECTED" | null

    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static GlobalUserResponse from(User u) {
        if (u == null) return null;
        return GlobalUserResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole() != null ? u.getRole().name() : null)
                .matricNumber(u.getMatricNumber())
                .department(u.getDepartment())
                .phone(u.getPhone())
                .universityId(u.getUniversity() != null ? u.getUniversity().getId() : null)
                .universityName(u.getUniversity() != null ? u.getUniversity().getName() : null)
                .universityCode(u.getUniversity() != null ? u.getUniversity().getCode() : null)
                .isActive(u.getIsActive())
                .isVerified(u.getIsVerified())
                .registrationStatus(u.getRegistrationStatus() != null
                        ? u.getRegistrationStatus().name()
                        : null)                              // ⬅ NEW
                .createdAt(u.getCreatedAt())
                .build();
    }
}