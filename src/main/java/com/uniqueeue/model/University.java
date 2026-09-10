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

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

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

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}