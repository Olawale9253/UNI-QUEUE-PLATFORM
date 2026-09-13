package com.uniqueeue.model;

import com.uniqueeue.enums.AppointmentCategory;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_slots", indexes = {
        @Index(name = "idx_slot_university", columnList = "university_id"),
        @Index(name = "idx_slot_staff", columnList = "staff_id"),
        @Index(name = "idx_slot_start", columnList = "start_time"),
        @Index(name = "idx_slot_category", columnList = "category")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, columnDefinition = "VARCHAR(50)")
    @Builder.Default
    private AppointmentCategory category = AppointmentCategory.OTHER;

    @Column(length = 255)
    private String faculty;

    @Column(length = 255)
    private String department;

    @Column(length = 255)
    private String location;

    @Column(name = "room_detail", length = 255)
    private String roomDetail;

    @Column(name = "staff_role", length = 100)
    private String staffRole;

    @Column(name = "duration_minutes")
    @Builder.Default
    private Integer durationMinutes = 30;

    @Column(name = "what_to_bring", columnDefinition = "TEXT")
    private String whatToBring;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 1;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}