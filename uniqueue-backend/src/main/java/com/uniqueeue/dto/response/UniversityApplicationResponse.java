package com.uniqueeue.dto.response;

import com.uniqueeue.model.UniversityApplication;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UniversityApplicationResponse {
    private Long id;
    private String universityName;
    private String universityCode;
    private String emailDomain;
    private String adminFullName;
    private String adminEmail;
    private String adminPhone;
    private String adminRole;
    private String message;
    private String status;
    private String rejectionReason;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    public static UniversityApplicationResponse from(UniversityApplication a) {
        if (a == null) return null;
        return UniversityApplicationResponse.builder()
                .id(a.getId())
                .universityName(a.getUniversityName())
                .universityCode(a.getUniversityCode())
                .emailDomain(a.getEmailDomain())
                .adminFullName(a.getAdminFullName())
                .adminEmail(a.getAdminEmail())
                .adminPhone(a.getAdminPhone())
                .adminRole(a.getAdminRole())
                .message(a.getMessage())
                .status(a.getStatus() != null ? a.getStatus().name() : null)
                .rejectionReason(a.getRejectionReason())
                .reviewedAt(a.getReviewedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}