package com.uniqueeue.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentStatsResponse {

    /** Total appointments ever created. */
    private long total;

    /** BOOKED appointments with a slot start time today. */
    private long today;

    /** BOOKED appointments with a slot start time in the future. */
    private long upcoming;

    /** COMPLETED appointments, all time. */
    private long completed;

    /** CANCELLED appointments, all time. */
    private long cancelled;

    /** Human-readable timestamp of the next upcoming appointment, or null. */
    private String nextStartTime;

    /** Full name of the student in the next upcoming appointment, or null. */
    private String nextStudentName;
}