package com.uniqueeue.service;

import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.StudentRegistry;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.StudentRegistryRepository;
import com.uniqueeue.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentRegistryService {

    private final StudentRegistryRepository registryRepository;
    private final UniversityRepository universityRepository;

    // ═══════════════════════════════════════════════════════════
    //  CSV UPLOAD
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public int uploadCsv(Long universityId, MultipartFile file, boolean replace) {
        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is empty");
        }

        if (replace) {
            registryRepository.deleteByUniversityId(universityId);
        }

        List<StudentRegistry> batch = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine();
            if (header == null) throw new BadRequestException("CSV is empty");
            Map<String, Integer> idx = parseHeader(header);

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) continue;
                try {
                    StudentRegistry row = buildFromCells(university, parseCsvLine(line), idx);
                    if (row != null) batch.add(row);
                } catch (Exception ex) {
                    log.warn("Skipping registry CSV line {}: {}", lineNumber, ex.getMessage());
                }
            }
        } catch (IOException io) {
            throw new BadRequestException("Failed to read CSV: " + io.getMessage());
        }

        if (batch.isEmpty()) {
            throw new BadRequestException("No valid rows found in the CSV");
        }

        registryRepository.saveAll(batch);
        log.info("Uploaded {} registry rows for {}", batch.size(), university.getCode());
        return batch.size();
    }

    // ═══════════════════════════════════════════════════════════
    //  MATCHING
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Optional<StudentRegistry> matchByMatric(University university, String matric) {
        if (matric == null || matric.isBlank()) return Optional.empty();
        return registryRepository.findByUniversityAndMatric(university.getId(), matric.trim());
    }

    @Transactional
    public void markClaimed(Long registryId, User user) {
        registryRepository.findById(registryId).ifPresent(entry -> {
            entry.setClaimedBy(user);
            entry.setClaimedAt(LocalDateTime.now());
            registryRepository.save(entry);
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  LISTING / STATS / CLEANUP
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Page<StudentRegistry> list(Long universityId, int page, int size) {
        return registryRepository.findByUniversityId(
                universityId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> stats(Long universityId) {
        long total = registryRepository.countByUniversityId(universityId);
        long unclaimed = registryRepository.countByUniversityIdAndClaimedByIsNull(universityId);
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("unclaimed", unclaimed);
        result.put("claimed", total - unclaimed);
        return result;
    }

    @Transactional
    public void clearAll(Long universityId) {
        registryRepository.deleteByUniversityId(universityId);
    }

    // ═══════════════════════════════════════════════════════════
    //  CSV HELPERS
    // ═══════════════════════════════════════════════════════════

    private Map<String, Integer> parseHeader(String header) {
        List<String> cols = parseCsvLine(header);
        Map<String, Integer> idx = new HashMap<>();
        for (int i = 0; i < cols.size(); i++) {
            idx.put(normalizeHeader(cols.get(i)), i);
        }

        boolean hasMatric = idx.containsKey("matricnumber")
                || idx.containsKey("matric")
                || idx.containsKey("matricno")
                || idx.containsKey("matriculationnumber");
        boolean hasName = idx.containsKey("fullname") || idx.containsKey("name");

        if (!hasMatric) throw new BadRequestException("CSV must include a 'matric_number' column");
        if (!hasName)   throw new BadRequestException("CSV must include a 'full_name' column");
        return idx;
    }

    private String normalizeHeader(String header) {
        return header.toLowerCase()
                .replaceAll("[\\s_\\-]+", "")
                .replaceAll("[^a-z0-9]", "");
    }

    private StudentRegistry buildFromCells(University university, List<String> cells, Map<String, Integer> idx) {
        String matric = firstNonBlank(cells, idx,
                "matricnumber", "matric", "matricno", "matriculationnumber");
        String name = firstNonBlank(cells, idx, "fullname", "name", "studentname");

        if (matric == null || name == null) return null;

        return StudentRegistry.builder()
                .university(university)
                .matricNumber(matric)
                .fullName(name)
                .department(firstNonBlank(cells, idx, "department", "dept"))
                .faculty(firstNonBlank(cells, idx, "faculty", "college", "school"))
                .level(firstNonBlank(cells, idx, "level", "yearofstudy"))
                .entryYear(parseInt(firstNonBlank(cells, idx, "entryyear", "year", "session")))
                .build();
    }

    private String firstNonBlank(List<String> cells, Map<String, Integer> idx, String... keys) {
        for (String key : keys) {
            Integer position = idx.get(key);
            if (position != null && position < cells.size()) {
                String value = cells.get(position);
                if (value != null && !value.isBlank()) return value.trim();
            }
        }
        return null;
    }

    private Integer parseInt(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            String cleaned = raw.replaceAll("[^0-9]", " ").trim();
            return Integer.parseInt(cleaned.split("\\s+")[0]);
        } catch (Exception e) {
            return null;
        }
    }

    /** Minimal RFC-ish CSV splitter — handles quoted cells. */
    private List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == ',' && !inQuotes) {
                out.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(ch);
            }
        }
        out.add(sb.toString());
        return out;
    }
}