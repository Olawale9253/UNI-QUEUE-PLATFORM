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

    public static GlobalUserResponse from(User user) {
        if (user == null) return null;
        return GlobalUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .matricNumber(user.getMatricNumber())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .universityId(user.getUniversity() != null ? user.getUniversity().getId() : null)
                .universityName(user.getUniversity() != null ? user.getUniversity().getName() : null)
                .universityCode(user.getUniversity() != null ? user.getUniversity().getCode() : null)
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .registrationStatus(user.getRegistrationStatus() != null
                        ? user.getRegistrationStatus().name()
                        : null)                              // ⬅ NEW
                .createdAt(user.getCreatedAt())
                .build();
    }
}