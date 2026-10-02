package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "university_closed_dates",
        uniqueConstraints = @UniqueConstraint(columnNames = {"university_id", "closed_date"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UniversityClosedDate {

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String source = "MANUAL";   // MANUAL | AUTO

    @Column(name = "external_id", length = 100)
    private String externalId;


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @Column(name = "closed_date", nullable = false)
    private LocalDate closedDate;

    @Column(length = 255)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}