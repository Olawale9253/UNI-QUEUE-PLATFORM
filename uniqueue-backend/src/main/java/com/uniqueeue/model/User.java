package com.uniqueeue.model;

import com.uniqueeue.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "unique_matric_per_university",
                        columnNames = {"university_id", "matric_number"}
                )
        }
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50, columnDefinition = "VARCHAR(50)")
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private University university;

    @Column(name = "matric_number", length = 50)
    private String matricNumber;

    @Column(length = 100)
    private String department;

    @Column(length = 20)
    private String phone;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "verification_token")
    private String verificationToken;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ───────── Fresher identifiers (only set for FRESHER role) ─────────

    @Column(name = "jamb_reg_number", length = 50, unique = true)
    private String jambRegNumber;

    @Column(name = "admission_ref", length = 100)
    private String admissionRef;

    @Column(name = "application_number", length = 100)
    private String applicationNumber;

    @Column(name = "admitted_student_id")
    private Long admittedStudentId;

    /** When the fresher provided their matric and upgraded to USER. */
    @Column(name = "upgraded_to_user_at")
    private LocalDateTime upgradedToUserAt;

    // ───────── Email change flow ─────────

    /**
     * Optional fallback email. Set automatically to the previous primary
     * email the first time a user changes their login email, so they never
     * lose access if they later forget their school email.
     */
    @Column(name = "recovery_email", length = 255)
    private String recoveryEmail;

    /** Email the user has asked to switch to (before verification). */
    @Column(name = "pending_email", length = 255)
    private String pendingEmail;

    /** 6-digit code sent to {@link #pendingEmail}. */
    @Column(name = "pending_email_code", length = 10)
    private String pendingEmailCode;

    /** When the pending code expires. */
    @Column(name = "pending_email_expires_at")
    private LocalDateTime pendingEmailExpiresAt;
}