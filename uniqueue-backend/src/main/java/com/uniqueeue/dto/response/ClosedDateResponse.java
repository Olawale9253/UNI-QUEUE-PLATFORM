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
    private LocalDateTime createdAt;

    public static ClosedDateResponse from(UniversityClosedDate d) {
        return ClosedDateResponse.builder()
                .id(d.getId())
                .closedDate(d.getClosedDate())
                .reason(d.getReason())
                .createdAt(d.getCreatedAt())
                .build();
    }
}