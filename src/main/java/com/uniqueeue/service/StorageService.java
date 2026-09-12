package com.uniqueeue.service;

/**
 * Abstraction over file storage. Local impl for dev,
 * can swap to Supabase Storage / S3 by adding a new @Service that
 * is @Primary in a prod profile.
 */
public interface StorageService {

    /**
     * Store a file and return its relative storage key.
     * @param content the raw bytes
     * @param originalFilename used only to derive the extension
     * @param universityId tenant scope (used as a directory prefix)
     */
    String store(byte[] content, String originalFilename, Long universityId);

    /** Retrieve raw bytes by storage key. */
    byte[] retrieve(String storageKey);

    /** Delete a file. No-op if missing. */
    void delete(String storageKey);

    /** True if the storage key exists. */
    boolean exists(String storageKey);
}