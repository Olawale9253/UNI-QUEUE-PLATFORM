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
            Document document,
            String uploadedByName,
            String ticketNumber,
            String reviewedByName) {
        return DocumentResponse.builder()
                .id(document.getId())
                .universityId(document.getUniversityId())
                .uploadedBy(document.getUploadedBy())
                .uploadedByName(uploadedByName)
                .ticketId(document.getTicketId())
                .ticketNumber(ticketNumber)
                .type(document.getType())
                .originalFilename(document.getOriginalFilename())
                .contentType(document.getContentType())
                .sizeBytes(document.getSizeBytes())
                .createdAt(document.getCreatedAt())
                .status(document.getStatus())
                .reviewedBy(document.getReviewedBy())
                .reviewedByName(reviewedByName)
                .reviewedAt(document.getReviewedAt())
                .reviewNotes(document.getReviewNotes())
                .downloadUrl("/api/documents/" + document.getId() + "/download")
                .build();
    }
}