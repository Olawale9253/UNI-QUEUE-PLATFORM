package com.uniqueeue.service;

import com.uniqueeue.dto.request.RegisterRequest;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.AdmittedStudent;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.AdmittedStudentRepository;
import com.uniqueeue.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdmittedStudentService {

    private final AdmittedStudentRepository admittedStudentRepository;
    private final UniversityRepository universityRepository;

    // ═══════════════════════════════════════════════════════════
    //  CSV UPLOAD
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public int uploadCsv(Long universityId, MultipartFile file, boolean replaceExisting) {
        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is empty");
        }

        if (replaceExisting) {
            admittedStudentRepository.deleteByUniversityId(universityId);
        }

        List<AdmittedStudent> batch = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new BadRequestException("CSV is empty");
            }
            Map<String, Integer> idx = parseHeader(headerLine);

            String line;
            int lineNumber = 1;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) continue;

                List<String> cells = parseCsvLine(line);
                try {
                    AdmittedStudent row = buildFromCells(university, cells, idx);
                    if (row != null) batch.add(row);
                } catch (Exception ex) {
                    log.warn("Skipping CSV line {}: {}", lineNumber, ex.getMessage());
                }
            }
        } catch (IOException iOException) {
            throw new BadRequestException("Failed to read CSV: " + iOException.getMessage());
        }

        if (batch.isEmpty()) {
            throw new BadRequestException("No valid rows found in the CSV");
        }

        admittedStudentRepository.saveAll(batch);
        log.info("Uploaded {} admitted students for university {}", batch.size(), university.getCode());
        return batch.size();
    }

    private Map<String, Integer> parseHeader(String header) {
        List<String> cols = parseCsvLine(header);
        Map<String, Integer> idx = new HashMap<>();
        for (int index = 0; index < cols.size(); index++) {
            idx.put(normalizeHeader(cols.get(index)), index);
        }
        // Require at least full_name
        if (!idx.containsKey("fullname") && !idx.containsKey("name")) {
            throw new BadRequestException("CSV must include a 'full_name' column");
        }
        return idx;
    }

    private String normalizeHeader(String stringValueValue2) {
        return stringValueValue2.toLowerCase()
                .replaceAll("[\\s_\\-]+", "")
                .replaceAll("[^a-z0-9]", "");
    }

    private AdmittedStudent buildFromCells(University universityValue7, List<String> cells, Map<String, Integer> idx) {
        String fullName = firstNonBlank(cells, idx, "fullname", "name", "studentname");
        if (fullName == null) return null;

        return AdmittedStudent.builder()
                .university(universityValue7)
                .fullName(fullName)
                .jambRegNumber(firstNonBlank(cells, idx, "jambregnumber", "jambreg", "jamb", "jambregistrationnumber"))
                .admissionRef(firstNonBlank(cells, idx, "admissionref", "admissionrefnumber", "admissionreference"))
                .applicationNumber(firstNonBlank(cells, idx, "applicationnumber", "applicationno", "appno", "application"))
                .department(firstNonBlank(cells, idx, "department", "dept"))
                .faculty(firstNonBlank(cells, idx, "faculty", "college", "school"))
                .admissionYear(parseInt(firstNonBlank(cells, idx, "admissionyear", "year", "session")))
                .build();
    }

    private String firstNonBlank(List<String> cells, Map<String, Integer> idx, String... keys) {
        for (String key : keys) {
            Integer indexValue = idx.get(key);
            if (indexValue != null && indexValue < cells.size()) {
                String val = cells.get(indexValue);
                if (val != null && !val.isBlank()) return val.trim();
            }
        }
        return null;
    }

    private Integer parseInt(String stringValueValue3) {
        if (stringValueValue3 == null || stringValueValue3.isBlank()) return null;
        try {
            // Accept "2025", "2025/2026", "2025/26"
            String cleaned = stringValueValue3.replaceAll("[^0-9]", " ").trim();
            String[] parts = cleaned.split("\\s+");
            return Integer.parseInt(parts[0]);
        } catch (Exception exceptionValue3) {
            return null;
        }
    }

    /** Minimal RFC-ish CSV line splitter — handles "..." quoting. */
    private List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int indexValue2 = 0; indexValue2 < line.length(); indexValue2++) {
            char character = line.charAt(indexValue2);
            if (character == '"') {
                if (inQuotes && indexValue2 + 1 < line.length() && line.charAt(indexValue2 + 1) == '"') {
                    sb.append('"');
                    indexValue2++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (character == ',' && !inQuotes) {
                out.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(character);
            }
        }
        out.add(sb.toString());
        return out;
    }

    // ═══════════════════════════════════════════════════════════
    //  MATCHING
    // ═══════════════════════════════════════════════════════════

    /**
     * Tries to find an unclaimed admitted-student row that matches the
     * fresher's identifiers. Priority order:
     *   1. JAMB reg (if provided)
     *   2. Admission ref (if provided)
     *   3. Application number (if provided)
     *   4. Full name (fuzzy)
     *
     * Returns null if no match.
     */
    @Transactional(readOnly = true)
    public AdmittedStudent matchFresher(University university, RegisterRequest req) {
        Long uniId = university.getId();

        if (req.getJambRegNumber() != null && !req.getJambRegNumber().isBlank()) {
            var hit = admittedStudentRepository.findUnclaimedByJambReg(uniId, req.getJambRegNumber().trim());
            if (hit.isPresent()) return hit.get();
        }
        if (req.getAdmissionRef() != null && !req.getAdmissionRef().isBlank()) {
            var hit = admittedStudentRepository.findUnclaimedByAdmissionRef(uniId, req.getAdmissionRef().trim());
            if (hit.isPresent()) return hit.get();
        }
        if (req.getApplicationNumber() != null && !req.getApplicationNumber().isBlank()) {
            var hit = admittedStudentRepository.findUnclaimedByApplicationNumber(uniId, req.getApplicationNumber().trim());
            if (hit.isPresent()) return hit.get();
        }

        // Name match — must be exact after normalization (case + space insensitive,
        // token-order-insensitive)
        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            String normalized = normalizeName(req.getFullName());
            var candidates = admittedStudentRepository.findUnclaimedByName(uniId, req.getFullName().trim());
            // If exact normalized match returns nothing, do a broader scan.
            if (candidates.isEmpty()) {
                candidates = admittedStudentRepository.findUnclaimedByName(uniId, "");
            }
            return candidates.stream()
                    .filter(valueValue2 -> normalizeName(valueValue2.getFullName()).equals(normalized))
                    .findFirst()
                    .orElse(null);
        }

        return null;
    }

    private String normalizeName(String name) {
        if (name == null) return "";
        String[] tokens = name.toLowerCase().trim().split("\\s+");
        Arrays.sort(tokens);
        return String.join(" ", tokens);
    }

    @Transactional
    public void markClaimed(Long admittedStudentId, User user) {
        AdmittedStudent admittedStudentValue = admittedStudentRepository.findById(admittedStudentId)
                .orElseThrow(() -> new ResourceNotFoundException("Admitted student not found"));

        // Defensive: the admitting row must belong to the same university as the user.
        if (admittedStudentValue.getUniversity() == null
                || user.getUniversity() == null
                || !admittedStudentValue.getUniversity().getId().equals(user.getUniversity().getId())) {
            throw new ResourceNotFoundException("Admitted student not found");
        }

        admittedStudentValue.setClaimedBy(user);
        admittedStudentValue.setClaimedAt(LocalDateTime.now());
        admittedStudentRepository.save(admittedStudentValue);
    }

    // ═══════════════════════════════════════════════════════════
    //  LISTING / CLEANUP
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public Page<AdmittedStudent> list(Long universityId, int page, int size) {
        return admittedStudentRepository.findByUniversityId(
                universityId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Long> stats(Long universityId) {
        Map<String, Long> statistics = new LinkedHashMap<>();
        statistics.put("total", admittedStudentRepository.countByUniversityId(universityId));
        statistics.put("unclaimed", admittedStudentRepository.countByUniversityIdAndClaimedByIsNull(universityId));
        statistics.put("claimed", statistics.get("total") - statistics.get("unclaimed"));
        return statistics;
    }

    @Transactional
    public void clearAll(Long universityId) {
        admittedStudentRepository.deleteByUniversityId(universityId);
    }
}