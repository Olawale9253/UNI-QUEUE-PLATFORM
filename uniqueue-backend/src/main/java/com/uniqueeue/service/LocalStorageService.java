package com.uniqueeue.service;

import com.uniqueeue.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Stores files on the local filesystem under `app.storage.base-path`.
 * Physical filenames are UUIDs — the original filename lives only in the DB.
 */
@Service
@Slf4j
public class LocalStorageService implements StorageService {

    private final Path root;

    public LocalStorageService(@Value("${app.storage.base-path}") String basePath) throws IOException {
        this.root = Paths.get(basePath).toAbsolutePath().normalize();
        Files.createDirectories(root);
        log.info("Local storage root: {}", root);
    }

    @Override
    public String store(byte[] content, String originalFilename, Long universityId) {
        try {
            String ext = extractExtension(originalFilename);
            String uuid = UUID.randomUUID().toString();
            LocalDate today = LocalDate.now();

            String relative = String.format("%d/%04d/%02d/%s%s",
                    universityId, today.getYear(), today.getMonthValue(), uuid, ext);

            Path target = root.resolve(relative).normalize();
            if (!target.startsWith(root)) {
                throw new IllegalArgumentException("Invalid storage path");
            }
            Files.createDirectories(target.getParent());
            Files.write(target, content);

            log.debug("Stored {} bytes as {}", content.length, relative);
            return relative;
        } catch (IOException iOExceptionValue5) {
            throw new RuntimeException("Failed to store file: " + iOExceptionValue5.getMessage(), iOExceptionValue5);
        }
    }

    @Override
    public byte[] retrieve(String storageKey) {
        try {
            Path target = safeResolve(storageKey);
            if (!Files.exists(target)) {
                throw new ResourceNotFoundException("File not found in storage");
            }
            return Files.readAllBytes(target);
        } catch (IOException iOExceptionValue6) {
            throw new ResourceNotFoundException("File not found in storage");
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Path target = safeResolve(storageKey);
            Files.deleteIfExists(target);
        } catch (IOException iOExceptionValue7) {
            log.warn("Failed to delete storage key {}: {}", storageKey, iOExceptionValue7.getMessage());
        }
    }

    @Override
    public boolean exists(String storageKey) {
        try {
            return Files.exists(safeResolve(storageKey));
        } catch (Exception exceptionValue9) {
            return false;
        }
    }

    // ---------- helpers ----------

    private Path safeResolve(String storageKey) {
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return target;
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        String ext = filename.substring(dot).toLowerCase();
        // Basic safety: only allow letters/digits in extension
        return ext.matches("\\.[a-z0-9]{1,10}") ? ext : "";
    }
}