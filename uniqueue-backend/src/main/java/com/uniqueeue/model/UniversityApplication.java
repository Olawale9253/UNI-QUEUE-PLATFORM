package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "university_applications")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UniversityApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "university_name", nullable = false)
    private String universityName;

    @Column(name = "university_code", nullable = false, length = 50)
    private String universityCode;

    @Column(name = "email_domain", length = 100)
    private String emailDomain;

    @Column(name = "admin_full_name", nullable = false)
    private String adminFullName;

    @Column(name = "admin_email", nullable = false)
    private String adminEmail;

    @Column(name = "admin_phone", length = 20)
    private String adminPhone;

    @Column(name = "admin_role", length = 100)
    private String adminRole; // e.g. "ICT Director", "Registrar"

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}