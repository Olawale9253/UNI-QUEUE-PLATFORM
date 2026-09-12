package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workflow_steps", uniqueConstraints = {
        @UniqueConstraint(name = "unique_workflow_step_order",
                columnNames = {"workflow_id", "step_order"})
}, indexes = {
        @Index(name = "idx_step_workflow", columnList = "workflow_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkflowStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workflow_id", nullable = false)
    private Workflow workflow;

    /** The queue students must clear at this step. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "queue_id", nullable = false)
    private Queue queue;

    /** 1-based order. Step 1 must be completed before step 2 unlocks. */
    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(length = 255)
    private String label;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "is_required")
    @Builder.Default
    private Boolean isRequired = true;
}