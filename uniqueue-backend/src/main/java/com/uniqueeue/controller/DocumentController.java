package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.DocumentResponse;
import com.uniqueeue.enums.DocumentStatus;
import com.uniqueeue.enums.DocumentType;
import com.uniqueeue.model.Document;
import com.uniqueeue.security.UserPrincipal;
import com.uniqueeue.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // ---------- GENERIC DOWNLOAD (used by all dashboards) ----------

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> downloadGeneric(
            @PathVariable Long id,
            @RequestParam(value = "inline", defaultValue = "false") boolean inline,
            @AuthenticationPrincipal UserPrincipal principal) {
        return buildDownload(documentService.getForAnyAuthorizedUser(principal, id), false);
    }

    // ---------- STUDENT ----------

    @PostMapping(value = "/user/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "ticketId", required = false) Long ticketId,
            @RequestParam(value = "type", required = false) DocumentType type,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("File uploaded",
                documentService.upload(principal.getId(), ticketId, type, file)));
    }

    @GetMapping("/user/documents")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listMine(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "My documents", documentService.listMine(principal.getId())));
    }

    @GetMapping("/user/documents/{id}")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> getMine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Document", documentService.getMine(principal.getId(), id)));
    }

    @DeleteMapping("/user/documents/{id}")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<Object>> deleteMine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        documentService.deleteOwned(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }

    @GetMapping("/user/documents/{id}/download")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<Resource> downloadMine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return buildDownload(documentService.getOwnedRaw(principal.getId(), id), false);
    }

    // ---------- STAFF ----------

    @GetMapping("/staff/documents")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listForStaff(
            @RequestParam(value = "status", required = false) DocumentStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Documents", documentService.listForStaff(principal.getId(), status)));
    }

    @GetMapping("/staff/documents/stats")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> staffDocStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = new HashMap<>();
        data.put("pending", documentService.countPendingForStaff(principal.getId()));
        return ResponseEntity.ok(ApiResponse.success("Document stats", data));
    }

    @PostMapping("/staff/documents/{id}/approve")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<DocumentResponse>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.success("Document approved",
                documentService.approve(principal.getId(), id, notes)));
    }

    @PostMapping("/staff/documents/{id}/reject")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<DocumentResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.success("Document rejected",
                documentService.reject(principal.getId(), id, notes)));
    }

    @GetMapping("/staff/documents/{id}/download")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Resource> downloadForStaff(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return buildDownload(documentService.getForStaffRaw(principal.getId(), id), false);
    }

    @GetMapping("/staff/tickets/{ticketId}/documents")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listForTicketAsStaff(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("Ticket documents",
                documentService.listForTicketAsStaff(principal.getId(), ticketId)));
    }

    // ---------- ADMIN ----------

    @GetMapping("/admin/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listForUniversity(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success("University documents",
                documentService.listForUniversity(principal.getUniversityId())));
    }

    @GetMapping("/admin/documents/{id}/download")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadForAdmin(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return buildDownload(
                documentService.getForUniversityRaw(principal.getUniversityId(), id),
                false);
    }

    // ---------- SUPER ADMIN ----------

    @GetMapping("/super-admin/documents/{id}/download")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Resource> downloadAsSuperAdmin(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return buildDownload(documentService.getForAnyAuthorizedUser(principal, id), false);
    }

    // ---------- HELPER ----------

    private ResponseEntity<Resource> buildDownload(Document doc, boolean inline) {
        byte[] bytes = documentService.readBytes(doc);
        Resource resource = new ByteArrayResource(bytes);

        String safeName = doc.getOriginalFilename() == null
                ? "document"
                : doc.getOriginalFilename().replace("\"", "");

        String disposition = (inline ? "inline" : "attachment")
                + "; filename=\"" + safeName + "\"";

        MediaType mediaType;
        try {
            mediaType = doc.getContentType() != null
                    ? MediaType.parseMediaType(doc.getContentType())
                    : MediaType.APPLICATION_OCTET_STREAM;
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .contentType(mediaType)
                .contentLength(bytes.length)
                .body(resource);
    }
}