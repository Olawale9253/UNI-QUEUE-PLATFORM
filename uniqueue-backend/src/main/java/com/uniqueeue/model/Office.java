package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(
        name = "offices",
        uniqueConstraints = @UniqueConstraint(
                name = "unique_office_per_university",
                columnNames = {"university_id", "name"}
        )
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Office {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 255)
    private String location;

    @Column(length = 50)
    private String icon;

    /** When the office opens (e.g. 08:00). */
    @Column(name = "opening_time")
    @Builder.Default
    private LocalTime openingTime = LocalTime.of(9, 0);

    /** When the office closes (e.g. 17:00). */
    @Column(name = "closing_time")
    @Builder.Default
    private LocalTime closingTime = LocalTime.of(17, 0);

    /** Typical appointment slot length, in minutes. */
    @Column(name = "slot_duration_minutes")
    @Builder.Default
    private Integer slotDurationMinutes = 15;

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