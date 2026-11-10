package com.uniqueeue.model;

import com.uniqueeue.enums.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments", indexes = {
        @Index(name = "idx_appt_slot", columnList = "slot_id"),
        @Index(name = "idx_appt_student", columnList = "student_id"),
        @Index(name = "idx_appt_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slot_id", nullable = false)
    private AppointmentSlot slot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // Stored as String to survive stale enum values in DB
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private String status = "BOOKED";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    private String staffNotes;

    @CreatedDate
    @Column(name = "booked_at", updatable = false)
    private LocalDateTime bookedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /** Safe enum accessor — falls back to BOOKED if stored value is unknown. */
    @Transient
    public AppointmentStatus getStatusEnum() {
        if (status == null) return AppointmentStatus.BOOKED;
        try {
            return AppointmentStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            return AppointmentStatus.BOOKED;
        }
    }

    /** Safe enum setter — stores the enum name as a String. */
    @Transient
    public void setStatusEnum(AppointmentStatus s) {
        this.status = (s == null) ? null : s.name();
    }
}