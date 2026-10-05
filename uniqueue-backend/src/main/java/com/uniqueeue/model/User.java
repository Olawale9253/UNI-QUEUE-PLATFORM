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

    // ───────── Verification code state ─────────

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verification_attempts")
    @Builder.Default
    private Integer verificationAttempts = 0;

    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;

    @Column(name = "last_verification_sent_at")
    private LocalDateTime lastVerificationSentAt;

    /**
     * Incremented whenever we want to invalidate all existing JWTs for this
     * user (password change, admin deactivation, role change, etc).
     * Included in every JWT as the "tv" claim. Filter rejects on mismatch.
     */
    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private Integer tokenVersion = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ───────── Fresher identifiers ─────────

    @Column(name = "jamb_reg_number", length = 50, unique = true)
    private String jambRegNumber;

    @Column(name = "admission_ref", length = 100)
    private String admissionRef;

    @Column(name = "application_number", length = 100)
    private String applicationNumber;

    @Column(name = "admitted_student_id")
    private Long admittedStudentId;

    @Column(name = "upgraded_to_user_at")
    private LocalDateTime upgradedToUserAt;

    // ───────── Email change flow ─────────

    @Column(name = "recovery_email", length = 255)
    private String recoveryEmail;

    @Column(name = "pending_email", length = 255)
    private String pendingEmail;

    @Column(name = "pending_email_code", length = 10)
    private String pendingEmailCode;

    @Column(name = "pending_email_expires_at")
    private LocalDateTime pendingEmailExpiresAt;
}