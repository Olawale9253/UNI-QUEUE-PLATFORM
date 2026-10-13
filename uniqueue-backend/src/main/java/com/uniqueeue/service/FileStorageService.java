package com.uniqueeue.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private final Path rootLocation;
    private final long maxFileSize;
    private final Set<String> allowedTypes;

    public FileStorageService(
            @Value("${app.storage.base-path:./data/uploads}") String basePath,
            @Value("${app.storage.max-file-size:5242880}") long maxFileSize,
            @Value("${app.storage.allowed-types:image/jpeg,image/png,image/jpg,image/webp}") String allowedTypesCsv) {
        this.rootLocation = Paths.get(basePath).toAbsolutePath().normalize();
        this.maxFileSize = maxFileSize;
        this.allowedTypes = Set.of(allowedTypesCsv.split(","));
        try {
            Files.createDirectories(rootLocation);
            log.info("File storage root: {}", rootLocation);
        } catch (IOException iOExceptionValue3) {
            throw new RuntimeException("Could not create upload directory", iOExceptionValue3);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                    "File too large. Max " + (maxFileSize / 1024 / 1024) + "MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) ext = original.substring(dot).toLowerCase();
        if (ext.length() > 10) ext = "";

        String stored = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = rootLocation.resolve(stored).normalize();

        if (!target.startsWith(rootLocation)) {
            throw new IllegalArgumentException("Invalid file path");
        }

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file {} ({} bytes)", stored, file.getSize());
        } catch (IOException iOExceptionValue4) {
            throw new RuntimeException("Failed to store file", iOExceptionValue4);
        }

        return stored;
    }

    public Path load(String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            throw new IllegalArgumentException("Invalid filename");
        }
        Path target = rootLocation.resolve(filename).normalize();
        if (!target.startsWith(rootLocation)) {
            throw new IllegalArgumentException("Invalid file path");
        }
        if (!Files.exists(target) || !Files.isRegularFile(target)) {
            throw new IllegalArgumentException("File not found: " + filename);
        }
        return target;
    }

    public void delete(String filename) {
        try {
            Path target = load(filename);
            Files.deleteIfExists(target);
            log.info("Deleted file {}", filename);
        } catch (Exception exceptionValue8) {
            log.warn("Failed to delete file {}: {}", filename, exceptionValue8.getMessage());
        }
    }

    public Path getRootLocation() {
        return rootLocation;
    }
}