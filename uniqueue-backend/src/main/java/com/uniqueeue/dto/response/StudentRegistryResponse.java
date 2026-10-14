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

    public static StudentRegistryResponse from(StudentRegistry registryEntry) {
        if (registryEntry == null) return null;
        return StudentRegistryResponse.builder()
                .id(registryEntry.getId())
                .matricNumber(registryEntry.getMatricNumber())
                .fullName(registryEntry.getFullName())
                .department(registryEntry.getDepartment())
                .faculty(registryEntry.getFaculty())
                .level(registryEntry.getLevel())
                .entryYear(registryEntry.getEntryYear())
                .claimedByUserId(registryEntry.getClaimedBy() != null ? registryEntry.getClaimedBy().getId() : null)
                .claimedAt(registryEntry.getClaimedAt() != null ? registryEntry.getClaimedAt().toString() : null)
                .build();
    }
}