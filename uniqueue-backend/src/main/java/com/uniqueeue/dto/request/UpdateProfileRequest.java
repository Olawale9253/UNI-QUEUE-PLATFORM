package com.uniqueeue.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateProfileRequest {

    @Size(max = 255)
    private String fullName;

    @Size(max = 100)
    private String department;

    @Size(max = 20)
    private String phone;
}