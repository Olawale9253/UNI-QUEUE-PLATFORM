package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "queues")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Queue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Top-level grouping — e.g. "Bursary", "Library". */
    @Column(length = 100)
    private String department;

    /** Optional middle level — e.g. "Cashier Desk" inside Bursary. */
    @Column(name = "sub_department", length = 100)
    private String subDepartment;

    @Column(length = 255)
    private String location;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "opens_at")
    @Builder.Default
    private LocalTime opensAt = LocalTime.of(8, 0);

    @Column(name = "closes_at")
    @Builder.Default
    private LocalTime closesAt = LocalTime.of(17, 0);

    @Column(name = "max_capacity")
    @Builder.Default
    private Integer maxCapacity = 100;

    @Column(name = "average_service_minutes")
    @Builder.Default
    private Integer averageServiceMinutes = 5;

    @Column(name = "allow_waitlist")
    @Builder.Default
    private Boolean allowWaitlist = false;

    @Column(name = "auto_promote_waitlist")
    @Builder.Default
    private Boolean autoPromoteWaitlist = true;

    @Column(name = "max_waitlist_size")
    @Builder.Default
    private Integer maxWaitlistSize = 100;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @Column(name = "matric_required")
    @Builder.Default
    private Boolean matricRequired = false;
}