package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * A row from the university's official admission list. Uploaded by the
 * super admin. When a fresher registers, we try to match their input
 * (JAMB reg, admission ref, application number, full name) against this
 * table. A successful match automatically verifies the fresher.
 */
@Entity
@Table(name = "admitted_students")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdmittedStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "jamb_reg_number", length = 50)
    private String jambRegNumber;

    @Column(name = "admission_ref", length = 100)
    private String admissionRef;

    @Column(name = "application_number", length = 100)
    private String applicationNumber;

    private String department;
    private String faculty;

    @Column(name = "admission_year")
    private Integer admissionYear;

    /** Once a fresher claims this entry, this FK is set. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_by_user_id")
    private User claimedBy;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}