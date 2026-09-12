package com.uniqueeue.repository;

import com.uniqueeue.enums.DocumentType;
import com.uniqueeue.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUploadedByOrderByCreatedAtDesc(Long uploadedBy);

    List<Document> findByTicketIdOrderByCreatedAtDesc(Long ticketId);

    List<Document> findByUniversityIdOrderByCreatedAtDesc(Long universityId);

    List<Document> findByUniversityIdAndTypeOrderByCreatedAtDesc(Long universityId, DocumentType type);

    boolean existsByStorageKey(String storageKey);
}