package com.uniqueeue.service;

import com.uniqueeue.dto.request.UpdatePlanConfigRequest;
import com.uniqueeue.dto.response.PlanConfigResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.PlanConfig;
import com.uniqueeue.repository.PlanConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanConfigService {

    private final PlanConfigRepository planConfigRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<PlanConfigResponse> listAll() {
        return planConfigRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(PlanConfigResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PlanConfigResponse getByCode(String code) {
        PlanConfig planConfigValue = planConfigRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + code));
        return PlanConfigResponse.from(planConfigValue);
    }

    @Transactional
    public PlanConfigResponse update(Long id, UpdatePlanConfigRequest request) {
        PlanConfig planConfigValue2 = planConfigRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Plan not found"));

        if (request.getLabel() != null && !request.getLabel().isBlank()) {
            planConfigValue2.setLabel(request.getLabel().trim());
        }
        if (request.getPriceUsd() != null) planConfigValue2.setPriceUsd(request.getPriceUsd());
        if (request.getMaxQueues() != null) planConfigValue2.setMaxQueues(request.getMaxQueues());
        if (request.getMaxStaff() != null) planConfigValue2.setMaxStaff(request.getMaxStaff());
        if (request.getMaxTicketsPerDay() != null) planConfigValue2.setMaxTicketsPerDay(request.getMaxTicketsPerDay());
        if (request.getIsActive() != null) planConfigValue2.setIsActive(request.getIsActive());
        if (request.getDisplayOrder() != null) planConfigValue2.setDisplayOrder(request.getDisplayOrder());

        PlanConfig saved = planConfigRepository.save(planConfigValue2);

        auditService.record(null, null,
                AuditAction.UNIVERSITY_UPDATED,
                "PlanConfig", saved.getId(),
                "{\"code\":\"" + saved.getCode() +
                        "\",\"price\":" + saved.getPriceUsd() +
                        ",\"maxQueues\":" + saved.getMaxQueues() +
                        ",\"maxStaff\":" + saved.getMaxStaff() + "}");

        log.info("Plan {} updated: price=${}, queues={}, staff={}",
                saved.getCode(), saved.getPriceUsd(), saved.getMaxQueues(), saved.getMaxStaff());

        return PlanConfigResponse.from(saved);
    }
}