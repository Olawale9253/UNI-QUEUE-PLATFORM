package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "plan_configs")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code; // FREE, BASIC, PREMIUM, ENTERPRISE

    @Column(nullable = false)
    private String label;

    @Column(name = "price_usd")
    @Builder.Default
    private Double priceUsd = 0.0;

    @Column(name = "max_queues", nullable = false)
    private Integer maxQueues;

    @Column(name = "max_staff", nullable = false)
    private Integer maxStaff;

    @Column(name = "max_tickets_per_day", nullable = false)
    private Integer maxTicketsPerDay;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}