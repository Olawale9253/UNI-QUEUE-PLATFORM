package com.uniqueeue.repository;

import com.uniqueeue.model.PlanConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanConfigRepository extends JpaRepository<PlanConfig, Long> {
    Optional<PlanConfig> findByCode(String code);
    List<PlanConfig> findAllByOrderByDisplayOrderAsc();
}