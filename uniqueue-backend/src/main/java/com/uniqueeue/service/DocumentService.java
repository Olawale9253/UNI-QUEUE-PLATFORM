package com.uniqueeue.service;

import com.uniqueeue.dto.response.DocumentResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.DocumentStatus;
import com.uniqueeue.enums.DocumentType;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Document;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.DocumentRepository;
import com.uniqueeue.repository.QueueStaffRepository;
import com.uniqueeue.repository.TicketRepository;
import com.uniqueeue.repository.UserRepository;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
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
    private final NotificationService notificationService;

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
        if (file == null || file.isEmpty()) throw new BadRequestException("File is required");
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

        if (ticketId != null) {
            Ticket ticket = ticketRepository.findById(ticketId)
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
            if (!ticket.getUser().getId().equals(userId)) {
                throw new ResourceNotFoundException("Ticket not found");   // ← 404 (was 400)
            }
        }

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException iOExceptionValue) {
            throw new RuntimeException("Failed to read upload", iOExceptionValue);
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
                .status(DocumentStatus.PENDING)
                .build();

        Document saved = documentRepository.save(doc);

        auditService.record(userId, universityId,
                AuditAction.DOCUMENT_UPLOADED, "Document", saved.getId(),
                "{\"filename\":\"" + saved.getOriginalFilename()
                        + "\",\"size\":" + saved.getSizeBytes()
                        + ",\"type\":\"" + saved.getType() + "\"}");

        return enrich(saved);
    }

    // ---------- READ (student) ----------

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
            throw new ResourceNotFoundException("Document not found");     // ← 404
        }
        return enrich(doc);
    }

    @Transactional(readOnly = true)
    public Document getOwnedRaw(Long userId, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUploadedBy().equals(userId)) {
            throw new ResourceNotFoundException("Document not found");     // ← 404
        }
        return doc;
    }

    // ---------- READ (staff — review queue) ----------

    @Transactional(readOnly = true)
    public List<DocumentResponse> listForStaff(Long staffId, DocumentStatus status) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (staff.getUniversity() == null) return List.of();
        Long uniId = staff.getUniversity().getId();

        if (status == null || status == DocumentStatus.PENDING) {
            return documentRepository
                    .findByUniversityIdAndStatusOrderByCreatedAtAsc(uniId, DocumentStatus.PENDING)
                    .stream().map(this::enrich).toList();
        }
        return documentRepository
                .findByUniversityIdAndStatusOrderByCreatedAtDesc(uniId, status)
                .stream().map(this::enrich).toList();
    }

    @Transactional(readOnly = true)
    public long countPendingForStaff(Long staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (staff.getUniversity() == null) return 0;
        return documentRepository.countByUniversityIdAndStatus(
                staff.getUniversity().getId(), DocumentStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public Document getForStaffRaw(Long staffId, Long docId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (staff.getUniversity() == null
                || !doc.getUniversityId().equals(staff.getUniversity().getId())) {
            throw new ResourceNotFoundException("Document not found");     // ← 404
        }
        return doc;
    }

    // ---------- REVIEW ----------

    @Transactional
    public DocumentResponse approve(Long staffId, Long docId, String notes) {
        return review(staffId, docId, DocumentStatus.APPROVED, notes);
    }

    @Transactional
    public DocumentResponse reject(Long staffId, Long docId, String notes) {
        return review(staffId, docId, DocumentStatus.REJECTED, notes);
    }

    private DocumentResponse review(Long staffId, Long docId, DocumentStatus newStatus, String notes) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        if (staff.getUniversity() == null
                || !doc.getUniversityId().equals(staff.getUniversity().getId())) {
            throw new ResourceNotFoundException("Document not found");     // ← 404
        }
        if (doc.getStatus() != DocumentStatus.PENDING) {
            throw new BadRequestException("This document has already been reviewed");
        }
        if (newStatus == DocumentStatus.REJECTED && (notes == null || notes.isBlank())) {
            throw new BadRequestException("A reason is required when rejecting a document");
        }

        doc.setStatus(newStatus);
        doc.setReviewedBy(staffId);
        doc.setReviewedAt(LocalDateTime.now());
        doc.setReviewNotes(notes != null && !notes.isBlank() ? notes.trim() : null);
        Document saved = documentRepository.save(doc);

        User uploader = userRepository.findById(doc.getUploadedBy()).orElse(null);
        if (uploader != null) {
            String title = newStatus == DocumentStatus.APPROVED
                    ? "Document approved"
                    : "Document rejected";
            String message = newStatus == DocumentStatus.APPROVED
                    ? "\"" + doc.getOriginalFilename() + "\" was approved."
                    : "\"" + doc.getOriginalFilename() + "\" was rejected. "
                    + (notes != null ? "Reason: " + notes : "");
            notificationService.notify(uploader, NotificationType.SYSTEM, title, message);
        }

        auditService.record(staffId, doc.getUniversityId(),
                newStatus == DocumentStatus.APPROVED
                        ? AuditAction.DOCUMENT_UPLOADED
                        : AuditAction.DOCUMENT_DELETED,
                "Document", docId,
                "{\"review\":\"" + newStatus + "\"}");

        return enrich(saved);
    }

    // ---------- ROLE-AWARE DOWNLOAD ----------

    @Transactional(readOnly = true)
    public Document getForAnyAuthorizedUser(UserPrincipal principal, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        Role role = principal.getRole();

        if (role == Role.SUPER_ADMIN) {
            return doc;
        }

        if (role == Role.ADMIN || role == Role.STAFF) {
            if (principal.getUniversityId() == null
                    || !doc.getUniversityId().equals(principal.getUniversityId())) {
                throw new ResourceNotFoundException("Document not found");  // ← 404
            }
            return doc;
        }

        // USER or FRESHER
        if (!doc.getUploadedBy().equals(principal.getId())) {
            throw new ResourceNotFoundException("Document not found");      // ← 404
        }
        return doc;
    }

    // ---------- LEGACY ----------

    @Transactional(readOnly = true)
    public List<DocumentResponse> listForTicketAsStaff(Long staffId, Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (!queueStaffRepository.existsByQueueIdAndUserId(ticket.getQueue().getId(), staffId)) {
            throw new ResourceNotFoundException("Ticket not found");
        }
        return documentRepository.findByTicketIdOrderByCreatedAtDesc(ticketId)
                .stream().map(this::enrich).toList();
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
            throw new ResourceNotFoundException("Document not found");      // ← 404
        }
        return doc;
    }

    // ⚠️ getRaw() DELETED — it had no tenant check and no legitimate callers
    //    after DocumentController switched to getForAnyAuthorizedUser().

    // ---------- DELETE ----------

    @Transactional
    public void deleteOwned(Long userId, Long docId) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!doc.getUploadedBy().equals(userId)) {
            throw new ResourceNotFoundException("Document not found");      // ← 404
        }

        if (doc.getStatus() == DocumentStatus.APPROVED) {
            throw new BadRequestException("Approved documents cannot be deleted");
        }

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

    // ---------- STREAMING ----------

    public byte[] readBytes(Document doc) {
        return storageService.retrieve(doc.getStorageKey());
    }

    // ---------- HELPERS ----------

    private DocumentResponse enrich(Document documentValue) {
        String uploaderName = userRepository.findById(documentValue.getUploadedBy())
                .map(User::getFullName).orElse(null);
        String ticketNumber = documentValue.getTicketId() != null
                ? ticketRepository.findById(documentValue.getTicketId())
                .map(Ticket::getTicketNumber).orElse(null)
                : null;
        String reviewerName = documentValue.getReviewedBy() != null
                ? userRepository.findById(documentValue.getReviewedBy())
                .map(User::getFullName).orElse(null)
                : null;
        return DocumentResponse.from(documentValue, uploaderName, ticketNumber, reviewerName);
    }

    private String sanitizeFilename(String original) {
        if (original == null || original.isBlank()) return "file";
        String base = original.replaceAll(".*[/\\\\]", "");
        return base.length() > 255 ? base.substring(base.length() - 255) : base;
    }
}