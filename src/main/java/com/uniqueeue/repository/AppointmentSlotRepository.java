package com.uniqueeue.repository;

import com.uniqueeue.model.AppointmentSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentSlotRepository extends JpaRepository<AppointmentSlot, Long> {

    List<AppointmentSlot> findByStaffIdOrderByStartTimeAsc(Long staffId);

    List<AppointmentSlot> findByUniversityIdOrderByStartTimeAsc(Long universityId);

    List<AppointmentSlot> findByUniversityIdAndIsActiveTrueOrderByStartTimeAsc(Long universityId);

    @Query("SELECT s FROM AppointmentSlot s WHERE s.university.id = :universityId " +
            "AND s.isActive = true AND s.startTime > :now " +
            "ORDER BY s.startTime ASC")
    List<AppointmentSlot> findAvailableByUniversity(@Param("universityId") Long universityId,
                                                    @Param("now") LocalDateTime now);

    @Query("SELECT s FROM AppointmentSlot s WHERE s.staff.id = :staffId " +
            "AND s.isActive = true AND s.startTime > :now " +
            "ORDER BY s.startTime ASC")
    List<AppointmentSlot> findUpcomingByStaff(@Param("staffId") Long staffId,
                                              @Param("now") LocalDateTime now);
}