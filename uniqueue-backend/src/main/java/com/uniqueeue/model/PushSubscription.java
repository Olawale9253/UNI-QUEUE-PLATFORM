package com.uniqueeue.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "push_subscriptions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_push_endpoint",
                columnNames = { "endpoint" }
        )
)
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** The push service URL from the browser (unique per device+browser). */
    @Column(nullable = false, length = 500)
    private String endpoint;

    /** Public key from the browser subscription. */
    @Column(nullable = false, length = 200)
    private String p256dh;

    /** Auth secret from the browser subscription. */
    @Column(nullable = false, length = 100)
    private String auth;

    /** For debugging — which device/browser this came from. */
    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "failure_count")
    @Builder.Default
    private Integer failureCount = 0;
}