package com.uniqueeue.dto.response;

import com.uniqueeue.model.StudentRegistry;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentRegistryResponse {
    private Long id;
    private String matricNumber;
    private String fullName;
    private String department;
    private String faculty;
    private String level;
    private Integer entryYear;
    private Long claimedByUserId;
    private String claimedAt;

    public static StudentRegistryResponse from(StudentRegistry r) {
        if (r == null) return null;
        return StudentRegistryResponse.builder()
                .id(r.getId())
                .matricNumber(r.getMatricNumber())
                .fullName(r.getFullName())
                .department(r.getDepartment())
                .faculty(r.getFaculty())
                .level(r.getLevel())
                .entryYear(r.getEntryYear())
                .claimedByUserId(r.getClaimedBy() != null ? r.getClaimedBy().getId() : null)
                .claimedAt(r.getClaimedAt() != null ? r.getClaimedAt().toString() : null)
                .build();
    }
}