package com.uniqueeue.controller;

import com.uniqueeue.dto.response.ApiResponse;
import com.uniqueeue.ratelimit.RateKeyType;
import com.uniqueeue.ratelimit.RateLimited;
import com.uniqueeue.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('USER', 'FRESHER', 'STAFF', 'ADMIN', 'SUPER_ADMIN')")
    @RateLimited(limit = 20, windowSeconds = 3600, keyType = RateKeyType.USER, name = "file-upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            String stored = fileStorageService.store(file);
            String url = "/api/files/" + stored;

            Map<String, Object> data = new HashMap<>();
            data.put("filename", stored);
            data.put("url", url);
            data.put("size", file.getSize());
            data.put("contentType", file.getContentType());

            return ResponseEntity.ok(ApiResponse.success("File uploaded", data));
        } catch (IllegalArgumentException illegalArgumentException) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", illegalArgumentException.getMessage()
            ));
        } catch (Exception exceptionValue) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Upload failed: " + exceptionValue.getMessage()
            ));
        }
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) {
        try {
            Path path = fileStorageService.load(filename);
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType;
            try {
                contentType = Files.probeContentType(path);
            } catch (IOException ex) {
                contentType = null;
            }
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL,
                            "public, max-age=31536000, immutable")
                    .body(resource);
        } catch (MalformedURLException malformedURLException) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException illegalArgumentExceptionValue) {
            return ResponseEntity.notFound().build();
        }
    }
}