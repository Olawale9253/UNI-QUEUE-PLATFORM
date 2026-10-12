package com.uniqueeue.dto.request;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BulkIdsRequest {
    private List<Long> ids;
}