package com.uniqueeue.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentStatsResponse {

    private long total;
    private long today;
    private long upcoming;
    private long completed;
    private long cancelled;
    private String nextStartTime;
    private String nextStudentName;
}