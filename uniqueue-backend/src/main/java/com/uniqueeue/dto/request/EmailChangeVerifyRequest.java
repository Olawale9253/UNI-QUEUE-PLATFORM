package com.uniqueeue.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailChangeVerifyRequest {

    @NotBlank(message = "Verification code is required")
    @Size(min = 4, max = 10, message = "Verification code looks invalid")
    private String code;
}