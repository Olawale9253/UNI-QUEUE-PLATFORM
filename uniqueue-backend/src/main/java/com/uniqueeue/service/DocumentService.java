package com.uniqueeue.service;

import com.uniqueeue.dto.response.DocumentResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.DocumentType;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Document;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.DocumentRepository;
import com.uniqueeue.repository.QueueStaffRepository;
import com.uniqueeue.repository.TicketRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final QueueStaffRepository queueStaffRepository;
    private final StorageService storageService;
    private final AuditService auditService;

    @Value("${app.storage.max-file-size}")
    private long maxFileSize;

    @Value("${app.storage.allowed-types}")
    private String allowedTypesCsv;

    private Set<String> allowedTypesCache() {
        return new HashSet<>(Arrays.asList(allowedTypesCsv.split(",")));
    }

    // ---------- UPLOAD ----------

    @Transactional
    public DocumentResponse upload(Long userId, Long ticketId, DocumentType type, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        if (file.getSize() > maxFileSize) {
            throw new BadRequestException("File too large. Max " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypesCache().contains(contentType.toLowerCase())) {
            throw new BadRequestException("File type not allowed: " + contentType);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getUniversity() == null) {
            throw new BadRequestException("You must belong to a university to upload documents");
        }
        Long universityId = user.getUniversity().getId();

        // If linked to a ticket, verify ownership
        if (ticketId != null) {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
            if (!ticket.getUser().getId().equals(userId)) {
                throw new BadRequestException("Not your ticket");
            }
        }

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read upload", e);
        }

        String storageKey = storageService.store(content, file.getOriginalFilename(), universityId);

        Document doc = Document.builder()
                .universityId(universityId)
                .uploadedBy(userId)
                .ticketId(ticketId)
                .type(type != null ? type : DocumentType.OTHER)
                .originalFilename(sanitizeFilename(file.getOriginalFilename()))
                .storageKey(storageKey)
                .contentType(contentType)
                .sizeBytes(file.getSize())
                .build();

        Document saved = documentRepository.save(doc);

        auditService.record(userId, universityId,
                AuditAction.DOCUMENT_UPLOADED, "Document", saved.getId(),
                "{\"filename\":\"" + saved.getOriginalFilename()
                        + "\",\"size\":" + saved.getSizeBytes()
                        + ",\"type\":\"" + saved.getType() + "\"}");

        return enrich(saved);
    }

    // ---------- READ ----------

    @Transactional(readOnly = true)
    public List<DocumentResponse> listMine(Long userId) {
        return documentRepository.findByUploadedByOrderByCreatedAtDesc(userId)
                .stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getMine(Long userId, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUploadedBy().equals(userId)) {
            throw new BadRequestException("Not your document");
        }
        return enrich(doc);
    }

    @Transactional(readOnly = true)
    public Document getOwnedRaw(Long userId, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUploadedBy().equals(userId)) {
            throw new BadRequestException("Not your document");
        }
        return doc;
    }

    /** Staff can view documents attached to a ticket in one of their queues. */
    @Transactional(readOnly = true)
    public List<DocumentResponse> listForTicketAsStaff(Long staffId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (!queueStaffRepository.existsByQueueIdAndUserId(ticket.getQueue().getId(), staffId)) {
            throw new BadRequestException("You are not assigned to this ticket's queue");
        }
        return documentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId)
                .stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public Document getForStaffRaw(Long staffId, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (doc.getTicketId() == null) {
            throw new BadRequestException("Document is not linked to a ticket");
        }
        Ticket ticket = ticketRepository.findById(doc.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (!queueStaffRepository.existsByQueueIdAndUserId(ticket.getQueue().getId(), staffId)) {
            throw new BadRequestException("You are not assigned to this ticket's queue");
        }
        return doc;
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listForUniversity(Long universityId) {
        return documentRepository.findByUniversityIdOrderByCreatedAtDesc(universityId)
                .stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public Document getForUniversityRaw(Long universityId, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUniversityId().equals(universityId)) {
            throw new BadRequestException("Not in your university");
        }
        return doc;
    }

    @Transactional(readOnly = true)
    public Document getRaw(Long docId) {
        return documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
    }

    // ---------- DELETE ----------

    @Transactional
    public void deleteOwned(Long userId, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUploadedBy().equals(userId)) {
            throw new BadRequestException("Not your document");
        }
        // Only allow delete when not linked to a ticket that is already resolved
        if (doc.getTicketId() != null) {
            Ticket ticket = ticketRepository.findById(doc.getTicketId()).orElse(null);
            if (ticket != null && ticket.getStatus().name().matches("COMPLETED|NO_SHOW|CANCELLED")) {
                throw new BadRequestException("Cannot delete documents for closed tickets");
            }
        }

        storageService.delete(doc.getStorageKey());
        documentRepository.delete(doc);

        auditService.record(userId, doc.getUniversityId(),
                AuditAction.DOCUMENT_DELETED, "Document", docId,
                "{\"filename\":\"" + doc.getOriginalFilename() + "\"}");
    }

    // ---------- STREAMING HELPERS ----------

    public byte[] readBytes(Document doc) {
        return storageService.retrieve(doc.getStorageKey());
    }

    // ---------- HELPERS ----------

    private DocumentResponse enrich(Document d) {
        String uploaderName = userRepository.findById(d.getUploadedBy())
                .map(User::getFullName).orElse(null);
        String ticketNumber = d.getTicketId() != null
                ? ticketRepository.findById(d.getTicketId())
                .map(Ticket::getTicketNumber).orElse(null)
                : null;
        return DocumentResponse.from(d, uploaderName, ticketNumber);
    }

    private String sanitizeFilename(String original) {
        if (original == null || original.isBlank()) return "file";
        String base = original.replaceAll(".*[/\\\\]", ""); // strip any path
        return base.length() > 255 ? base.substring(base.length() - 255) : base;
    }
}