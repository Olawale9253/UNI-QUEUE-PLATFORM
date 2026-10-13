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

    private String officeName;


    public static AppointmentResponse from(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .status(appointment.getStatus())
                .slotId(appointment.getSlot() != null ? appointment.getSlot().getId() : null)
                .officeName(appointment.getSlot() != null ? appointment.getSlot().getDepartment() : null)
                .slotTitle(appointment.getSlot() != null ? appointment.getSlot().getTitle() : null)
                .slotLocation(appointment.getSlot() != null ? appointment.getSlot().getLocation() : null)
                .startTime(appointment.getSlot() != null ? appointment.getSlot().getStartTime() : null)
                .endTime(appointment.getSlot() != null ? appointment.getSlot().getEndTime() : null)
                .staffId(appointment.getSlot() != null && appointment.getSlot().getStaff() != null
                        ? appointment.getSlot().getStaff().getId() : null)
                .staffName(appointment.getSlot() != null && appointment.getSlot().getStaff() != null
                        ? appointment.getSlot().getStaff().getFullName() : null)
                .studentId(appointment.getStudent() != null ? appointment.getStudent().getId() : null)
                .studentName(appointment.getStudent() != null ? appointment.getStudent().getFullName() : null)
                .studentEmail(appointment.getStudent() != null ? appointment.getStudent().getEmail() : null)
                .matricNumber(appointment.getStudent() != null ? appointment.getStudent().getMatricNumber() : null)
                .notes(appointment.getNotes())
                .staffNotes(appointment.getStaffNotes())
                .bookedAt(appointment.getBookedAt())
                .cancelledAt(appointment.getCancelledAt())
                .completedAt(appointment.getCompletedAt())
                .build();
    }
}