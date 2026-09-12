package com.uniqueeue.model;

import com.uniqueeue.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_workflows", indexes = {
        @Index(name = "idx_sw_student", columnList = "student_id"),
        @Index(name = "idx_sw_workflow", columnList = "workflow_id"),
        @Index(name = "idx_sw_status", columnList = "status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "unique_student_workflow",
                columnNames = {"student_id", "workflow_id"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    /** The step order the student is currently on. Starts at 1. */
    @Column(name = "current_step_order", nullable = false)
    @Builder.Default
    private Integer currentStepOrder = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    @Builder.Default
    private WorkflowStatus status = WorkflowStatus.IN_PROGRESS;

    @CreatedDate
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}