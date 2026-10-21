package com.uniqueeue.model;

import com.uniqueeue.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // Stored as String to survive stale enum values in the DB
    @Column(length = 50, columnDefinition = "VARCHAR(50)")
    private String type;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "link", length = 500)
    private String link;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /** Safe enum accessor — falls back to SYSTEM if the stored value is unknown. */
    @Transient
    public NotificationType getTypeEnum() {
        if (type == null) return NotificationType.SYSTEM;
        try {
            return NotificationType.valueOf(type);
        } catch (IllegalArgumentException e) {
            return NotificationType.SYSTEM;
        }
    }

    /** Safe enum setter — stores the enum name as a String. */
    @Transient
    public void setTypeEnum(NotificationType t) {
        this.type = (t == null) ? null : t.name();
    }
}