package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * A row from the university's official student registry (list of active
 * students with their matric numbers). Uploaded by an admin. When a
 * continuing student registers, we cross-check their matric against this
 * list to decide whether to auto-verify or queue for review.
 */
@Entity
@Table(
        name = "student_registry",
        uniqueConstraints = @UniqueConstraint(
                name = "unique_matric_per_university_registry",
                columnNames = {"university_id", "matric_number"}
        ),
        indexes = @Index(name = "idx_registry_uni", columnList = "university_id")
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @Column(name = "matric_number", nullable = false, length = 50)
    private String matricNumber;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String department;
    private String faculty;
    private String level;

    @Column(name = "entry_year")
    private Integer entryYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_by_user_id")
    private User claimedBy;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}