package com.uniqueeue.repository;

import com.uniqueeue.model.UniversityRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UniversityRequestRepository extends JpaRepository<UniversityRequest, Long> {
}