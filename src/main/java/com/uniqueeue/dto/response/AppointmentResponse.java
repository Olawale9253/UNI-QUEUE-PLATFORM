package com.uniqueeue.dto.response;

import com.uniqueeue.enums.AppointmentStatus;
import com.uniqueeue.model.Appointment;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentResponse {

    private Long id;
    private AppointmentStatus status;

    private Long slotId;
    private String slotTitle;
    private String slotLocation;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Long staffId;
    private String staffName;

    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String matricNumber;

    private String notes;
    private String staffNotes;

    private LocalDateTime bookedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime completedAt;

    public static AppointmentResponse from(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .status(a.getStatus())
                .slotId(a.getSlot() != null ? a.getSlot().getId() : null)
                .slotTitle(a.getSlot() != null ? a.getSlot().getTitle() : null)
                .slotLocation(a.getSlot() != null ? a.getSlot().getLocation() : null)
                .startTime(a.getSlot() != null ? a.getSlot().getStartTime() : null)
                .endTime(a.getSlot() != null ? a.getSlot().getEndTime() : null)
                .staffId(a.getSlot() != null && a.getSlot().getStaff() != null
                        ? a.getSlot().getStaff().getId() : null)
                .staffName(a.getSlot() != null && a.getSlot().getStaff() != null
                        ? a.getSlot().getStaff().getFullName() : null)
                .studentId(a.getStudent() != null ? a.getStudent().getId() : null)
                .studentName(a.getStudent() != null ? a.getStudent().getFullName() : null)
                .studentEmail(a.getStudent() != null ? a.getStudent().getEmail() : null)
                .matricNumber(a.getStudent() != null ? a.getStudent().getMatricNumber() : null)
                .notes(a.getNotes())
                .staffNotes(a.getStaffNotes())
                .bookedAt(a.getBookedAt())
                .cancelledAt(a.getCancelledAt())
                .completedAt(a.getCompletedAt())
                .build();
    }
}