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

    public static AdmittedStudentResponse from(AdmittedStudent admittedStudent) {
        return AdmittedStudentResponse.builder()
                .id(admittedStudent.getId())
                .fullName(admittedStudent.getFullName())
                .jambRegNumber(admittedStudent.getJambRegNumber())
                .admissionRef(admittedStudent.getAdmissionRef())
                .applicationNumber(admittedStudent.getApplicationNumber())
                .department(admittedStudent.getDepartment())
                .faculty(admittedStudent.getFaculty())
                .admissionYear(admittedStudent.getAdmissionYear())
                .claimed(admittedStudent.getClaimedBy() != null)
                .claimedByUserId(admittedStudent.getClaimedBy() != null ? admittedStudent.getClaimedBy().getId() : null)
                .claimedByName(admittedStudent.getClaimedBy() != null ? admittedStudent.getClaimedBy().getFullName() : null)
                .claimedAt(admittedStudent.getClaimedAt())
                .createdAt(admittedStudent.getCreatedAt())
                .build();
    }
}