package com.uniqueeue.dto.response;

import com.uniqueeue.model.UniversityClosedDate;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClosedDateResponse {

    private Long id;
    private LocalDate closedDate;
    private String reason;
    private String source;       // MANUAL | AUTO
    private String externalId;
    private LocalDateTime createdAt;

    public static ClosedDateResponse from(UniversityClosedDate universityClosedDate) {
        return ClosedDateResponse.builder()
                .id(universityClosedDate.getId())
                .closedDate(universityClosedDate.getClosedDate())
                .reason(universityClosedDate.getReason())
                .source(universityClosedDate.getSource())
                .externalId(universityClosedDate.getExternalId())
                .createdAt(universityClosedDate.getCreatedAt())
                .build();
    }
}