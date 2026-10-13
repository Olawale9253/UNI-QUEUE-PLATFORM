package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "universities")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String timezone = "Africa/Lagos";

    @Column(name = "country_code", nullable = false, length = 2)
    @Builder.Default
    private String countryCode = "NG";

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "email_domain", length = 100)
    private String emailDomain;

    @Column(name = "matric_pattern")
    private String matricPattern;

    @Column(name = "matric_example", length = 100)
    private String matricExample;

    @Column(name = "matric_description")
    private String matricDescription;

    /**
     * How to verify a continuing student's matric number:
     * OPEN    — no checks, auto-verify everyone
     * PATTERN — regex only (default)
     * LIST    — must match the uploaded student registry
     * BOTH    — regex + registry match
     */
    @Column(name = "matric_verification_mode", length = 20)
    @Builder.Default
    private String matricVerificationMode = "PATTERN";

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "campus_image_url", length = 500)
    private String campusImageUrl;

    @Column(length = 255)
    private String tagline;

    @Column(name = "primary_color", length = 20)
    @Builder.Default
    private String primaryColor = "#3B82F6";

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(length = 50)
    @Builder.Default
    private String plan = "FREE";

    @Column(name = "max_staff")
    @Builder.Default
    private Integer maxStaff = 10;

    @Column(name = "max_queues")
    @Builder.Default
    private Integer maxQueues = 5;

    @Column(name = "max_tickets_per_day")
    @Builder.Default
    private Integer maxTicketsPerDay = 500;

    // ───────── Feature flags ─────────
    @Column(name = "feature_waitlist")
    @Builder.Default
    private Boolean featureWaitlist = true;

    @Column(name = "feature_appointments")
    @Builder.Default
    private Boolean featureAppointments = true;

    @Column(name = "feature_workflows")
    @Builder.Default
    private Boolean featureWorkflows = true;

    @Column(name = "feature_documents")
    @Builder.Default
    private Boolean featureDocuments = true;

    // ═══════════════════════════════════════════════════════════
    //  FRESHER REGISTRATION
    // ═══════════════════════════════════════════════════════════

    @Column(name = "fresher_registration_enabled")
    @Builder.Default
    private Boolean fresherRegistrationEnabled = true;

    @Column(name = "fresher_verification_mode", length = 20)
    @Builder.Default
    private String fresherVerificationMode = "PATTERN";

    // ─── JAMB Registration Number ───
    @Column(name = "require_jamb_reg")
    @Builder.Default
    private Boolean requireJambReg = true;

    @Column(name = "jamb_reg_pattern")
    private String jambRegPattern;

    @Column(name = "jamb_reg_example", length = 100)
    private String jambRegExample;

    @Column(name = "jamb_reg_description")
    private String jambRegDescription;

    // ─── Admission Reference Number ───
    @Column(name = "require_admission_ref")
    @Builder.Default
    private Boolean requireAdmissionRef = false;

    @Column(name = "admission_ref_pattern")
    private String admissionRefPattern;

    @Column(name = "admission_ref_example", length = 100)
    private String admissionRefExample;

    @Column(name = "admission_ref_description")
    private String admissionRefDescription;

    // ─── Application Number ───
    @Column(name = "require_application_number")
    @Builder.Default
    private Boolean requireApplicationNumber = false;

    @Column(name = "application_number_pattern")
    private String applicationNumberPattern;

    @Column(name = "application_number_example", length = 100)
    private String applicationNumberExample;

    @Column(name = "application_number_description")
    private String applicationNumberDescription;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}