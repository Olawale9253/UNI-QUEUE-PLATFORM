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

    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static GlobalUserResponse from(User userValue3) {
        return GlobalUserResponse.builder()
                .id(userValue3.getId())
                .email(userValue3.getEmail())
                .fullName(userValue3.getFullName())
                .role(userValue3.getRole() != null ? userValue3.getRole().name() : null)
                .matricNumber(userValue3.getMatricNumber())
                .department(userValue3.getDepartment())
                .phone(userValue3.getPhone())
                .universityId(userValue3.getUniversity() != null ? userValue3.getUniversity().getId() : null)
                .universityName(userValue3.getUniversity() != null ? userValue3.getUniversity().getName() : null)
                .universityCode(userValue3.getUniversity() != null ? userValue3.getUniversity().getCode() : null)
                .isActive(userValue3.getIsActive())
                .isVerified(userValue3.getIsVerified())
                .createdAt(userValue3.getCreatedAt())
                .build();
    }
}