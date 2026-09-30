package com.uniqueeue.dto.response;

import com.uniqueeue.enums.DocumentStatus;
import com.uniqueeue.enums.DocumentType;
import com.uniqueeue.model.Document;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentResponse {

    private Long id;
    private Long universityId;
    private Long uploadedBy;
    private String uploadedByName;
    private Long ticketId;
    private String ticketNumber;
    private DocumentType type;
    private String originalFilename;
    private String contentType;
    private Long sizeBytes;
    private LocalDateTime createdAt;

    // ─── Review state ───
    private DocumentStatus status;
    private Long reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String reviewNotes;

    /** Relative URL the client can GET to download the file. */
    private String downloadUrl;

    public static DocumentResponse from(
            Document d,
            String uploadedByName,
            String ticketNumber,
            String reviewedByName) {
        return DocumentResponse.builder()
                .id(d.getId())
                .universityId(d.getUniversityId())
                .uploadedBy(d.getUploadedBy())
                .uploadedByName(uploadedByName)
                .ticketId(d.getTicketId())
                .ticketNumber(ticketNumber)
                .type(d.getType())
                .originalFilename(d.getOriginalFilename())
                .contentType(d.getContentType())
                .sizeBytes(d.getSizeBytes())
                .createdAt(d.getCreatedAt())
                .status(d.getStatus())
                .reviewedBy(d.getReviewedBy())
                .reviewedByName(reviewedByName)
                .reviewedAt(d.getReviewedAt())
                .reviewNotes(d.getReviewNotes())
                .downloadUrl("/api/documents/" + d.getId() + "/download")
                .build();
    }
}