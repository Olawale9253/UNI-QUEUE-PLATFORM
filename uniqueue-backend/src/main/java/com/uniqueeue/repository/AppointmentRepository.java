package com.uniqueeue.repository;

import com.uniqueeue.enums.AppointmentStatus;
import com.uniqueeue.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByStudentIdOrderByBookedAtDesc(Long studentId);

    List<Appointment> findBySlotIdOrderByBookedAtAsc(Long slotId);

    long countBySlotIdAndStatus(Long slotId, AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.slot.staff.id = :staffId " +
            "ORDER BY a.slot.startTime DESC")
    List<Appointment> findByStaff(@Param("staffId") Long staffId);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.slot.staff.id = :staffId " +
            "AND a.status = com.uniqueeue.enums.AppointmentStatus.BOOKED " +
            "AND a.slot.startTime >= :dayStart AND a.slot.startTime < :dayEnd")
    long countTodayByStaff(@Param("staffId") Long staffId,
                           @Param("dayStart") LocalDateTime dayStart,
                           @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.slot.staff.id = :staffId " +
            "AND a.status = com.uniqueeue.enums.AppointmentStatus.BOOKED " +
            "AND a.slot.startTime > :now")
    long countUpcomingByStaff(@Param("staffId") Long staffId,
                              @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.slot.university.id = :universityId " +
            "AND a.status = com.uniqueeue.enums.AppointmentStatus.BOOKED " +
            "AND a.slot.startTime >= :dayStart AND a.slot.startTime < :dayEnd")
    long countTodayByUniversity(@Param("universityId") Long universityId,
                                @Param("dayStart") LocalDateTime dayStart,
                                @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.slot.university.id = :universityId " +
            "AND a.status = com.uniqueeue.enums.AppointmentStatus.BOOKED " +
            "AND a.slot.startTime > :now")
    long countUpcomingByUniversity(@Param("universityId") Long universityId,
                                   @Param("now") LocalDateTime now);

    long countBySlotUniversityIdAndStatus(Long universityId, AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.student.id = :studentId " +
            "AND a.status = com.uniqueeue.enums.AppointmentStatus.BOOKED " +
            "AND a.slot.startTime > :now " +
            "ORDER BY a.slot.startTime ASC")
    List<Appointment> findUpcomingByStudent(@Param("studentId") Long studentId,
                                            @Param("now") LocalDateTime now);

    /**
     * Count of BOOKED appointments for a student that overlap [start, end).
     * Used to prevent double-booking.
     */
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.student.id = :studentId " +
            "AND a.status = com.uniqueeue.enums.AppointmentStatus.BOOKED " +
            "AND a.slot.startTime < :endTime AND a.slot.endTime > :startTime")
    long countOverlapping(@Param("studentId") Long studentId,
                          @Param("startTime") LocalDateTime startTime,
                          @Param("endTime") LocalDateTime endTime);

    @Query("SELECT a FROM Appointment a WHERE a.slot.university.id = :universityId " +
            "ORDER BY a.slot.startTime DESC")
    List<Appointment> findByUniversity(@Param("universityId") Long universityId);
}