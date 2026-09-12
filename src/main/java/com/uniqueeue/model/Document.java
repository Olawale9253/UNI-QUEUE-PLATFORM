package com.uniqueeue.model;

import com.uniqueeue.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_doc_university", columnList = "university_id"),
        @Index(name = "idx_doc_uploader", columnList = "uploaded_by"),
        @Index(name = "idx_doc_ticket", columnList = "ticket_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tenant scope — always set from the uploader's university. */
    @Column(name = "university_id", nullable = false)
    private Long universityId;

    /** User who uploaded it. */
    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    /** Optional: which ticket this document supports. */
    @Column(name = "ticket_id")
    private Long ticketId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    @Builder.Default
    private DocumentType type = DocumentType.OTHER;

    /** The original filename the user uploaded. */
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    /** Relative path inside the storage root: "{universityId}/{yyyy}/{MM}/{uuid}.{ext}". */
    @Column(name = "storage_key", nullable = false, unique = true, length = 500)
    private String storageKey;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}