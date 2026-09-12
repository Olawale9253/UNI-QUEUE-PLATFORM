package com.uniqueeue.dto.response;

import com.uniqueeue.model.University;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UniversityResponse {

    private Long id;
    private String name;
    private String code;
    private String emailDomain;
    private String matricPattern;
    private String matricExample;
    private String matricDescription;
    private String logoUrl;
    private String primaryColor;
    private Boolean isActive;
    private String plan;
    private Integer maxStaff;
    private Integer maxQueues;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // live counters (optional)
    private Long queueCount;
    private Long staffCount;
    private Long userCount;
    private Long ticketCount;

    public static UniversityResponse from(University u) {
        return UniversityResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .code(u.getCode())
                .emailDomain(u.getEmailDomain())
                .matricPattern(u.getMatricPattern())
                .matricExample(u.getMatricExample())
                .matricDescription(u.getMatricDescription())
                .logoUrl(u.getLogoUrl())
                .primaryColor(u.getPrimaryColor())
                .isActive(u.getIsActive())
                .plan(u.getPlan())
                .maxStaff(u.getMaxStaff())
                .maxQueues(u.getMaxQueues())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}