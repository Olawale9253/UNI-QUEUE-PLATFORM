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

    private String matricNumber;
    private String department;
    private String phone;
    private Boolean isActive;
    private Boolean isVerified;
    private LocalDateTime createdAt;

    public static ProfileResponse from(User u) {
        return ProfileResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole() != null ? u.getRole().name() : null)
                .universityId(u.getUniversity() != null ? u.getUniversity().getId() : null)
                .universityName(u.getUniversity() != null ? u.getUniversity().getName() : null)
                .universityCode(u.getUniversity() != null ? u.getUniversity().getCode() : null)
                .universityLogoUrl(u.getUniversity() != null ? u.getUniversity().getLogoUrl() : null)
                .universityPrimaryColor(u.getUniversity() != null
                        ? u.getUniversity().getPrimaryColor() : null)
                .matricNumber(u.getMatricNumber())
                .department(u.getDepartment())
                .phone(u.getPhone())
                .isActive(u.getIsActive())
                .isVerified(u.getIsVerified())
                .createdAt(u.getCreatedAt())
                .build();
    }
}