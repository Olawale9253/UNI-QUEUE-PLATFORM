package com.uniqueeue.dto.response;

import com.uniqueeue.model.AdmittedStudent;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdmittedStudentResponse {

    private Long id;
    private String fullName;
    private String jambRegNumber;
    private String admissionRef;
    private String applicationNumber;
    private String department;
    private String faculty;
    private Integer admissionYear;
    private Boolean claimed;
    private Long claimedByUserId;
    private String claimedByName;
    private LocalDateTime claimedAt;
    private LocalDateTime createdAt;

    public static AdmittedStudentResponse from(AdmittedStudent a) {
        return AdmittedStudentResponse.builder()
                .id(a.getId())
                .fullName(a.getFullName())
                .jambRegNumber(a.getJambRegNumber())
                .admissionRef(a.getAdmissionRef())
                .applicationNumber(a.getApplicationNumber())
                .department(a.getDepartment())
                .faculty(a.getFaculty())
                .admissionYear(a.getAdmissionYear())
                .claimed(a.getClaimedBy() != null)
                .claimedByUserId(a.getClaimedBy() != null ? a.getClaimedBy().getId() : null)
                .claimedByName(a.getClaimedBy() != null ? a.getClaimedBy().getFullName() : null)
                .claimedAt(a.getClaimedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}