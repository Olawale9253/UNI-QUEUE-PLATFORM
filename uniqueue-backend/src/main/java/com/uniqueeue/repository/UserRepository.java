package com.uniqueeue.repository;

import com.uniqueeue.enums.Role;
import com.uniqueeue.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUniversityIdAndMatricNumber(Long universityId, String matricNumber);
    List<User> findByUniversityIdAndRole(Long universityId, Role role);
}