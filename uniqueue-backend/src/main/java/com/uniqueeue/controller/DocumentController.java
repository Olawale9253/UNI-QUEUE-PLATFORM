package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.dto.response.DocumentResponse;
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

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // ---------- STUDENT ----------

    @PostMapping(value = "/user/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER', 'FRESHER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "ticketId", required = false) Long ticketId,
            @RequestParam(value = "type", required = false) DocumentType type,
            @AuthenticationPrincipal UserPrincipal principal) {
        DocumentResponse response = documentService.upload(principal.getId(), ticketId, type, file);
        return ResponseEntity.ok(ApiResponse.success("File uploaded", response));
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
        Document doc = documentService.getOwnedRaw(principal.getId(), id);
        return buildDownload(doc);
    }

    // ---------- STAFF ----------

    @GetMapping("/staff/tickets/{ticketId}/documents")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listForTicketAsStaff(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ticket documents",
                documentService.listForTicketAsStaff(principal.getId(), ticketId)));
    }

    @GetMapping("/staff/documents/{id}/download")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Resource> downloadForStaff(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Document doc = documentService.getForStaffRaw(principal.getId(), id);
        return buildDownload(doc);
    }

    // ---------- ADMIN ----------

    @GetMapping("/admin/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listForUniversity(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                "University documents",
                documentService.listForUniversity(principal.getUniversityId())));
    }

    @GetMapping("/admin/documents/{id}/download")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadForAdmin(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Document doc = documentService.getForUniversityRaw(principal.getUniversityId(), id);
        return buildDownload(doc);
    }

    // ---------- SUPER ADMIN ----------

    @GetMapping("/super-admin/documents/{id}/download")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Resource> downloadAsSuperAdmin(@PathVariable Long id) {
        Document doc = documentService.getRaw(id);
        return buildDownload(doc);
    }

    // ---------- HELPERS ----------

    private ResponseEntity<Resource> buildDownload(Document doc) {
        byte[] data = documentService.readBytes(doc);
        String filename = doc.getOriginalFilename() != null ? doc.getOriginalFilename() : "download";
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (doc.getContentType() != null) {
            try { mediaType = MediaType.parseMediaType(doc.getContentType()); }
            catch (Exception ignored) { }
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename.replace("\"", "") + "\"")
                .contentLength(data.length)
                .body(new ByteArrayResource(data));
    }
}