package com.uniqueeue.service;

import com.uniqueeue.dto.response.AppointmentStatsResponse;
import com.uniqueeue.enums.AppointmentStatus;
import com.uniqueeue.model.Appointment;
import com.uniqueeue.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentStatsService {

    private final AppointmentRepository appointmentRepository;

    @Transactional(readOnly = true)
    public AppointmentStatsResponse forStaff(Long staffId) {
        List<Appointment> all = appointmentRepository.findByStaff(staffId);
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1);
        LocalDateTime now = LocalDateTime.now();

        long todayCount = appointmentRepository.countTodayByStaff(staffId, dayStart, dayEnd);
        long upcoming = appointmentRepository.countUpcomingByStaff(staffId, now);

        return build(all, todayCount, upcoming, now);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.uniqueeue.dto.response.AppointmentResponse> listAppointmentsForStaff(Long staffId) {
        return appointmentRepository.findByStaff(staffId).stream()
                .map(com.uniqueeue.dto.response.AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentStatsResponse forUniversity(Long universityId) {
        List<Appointment> all = appointmentRepository.findByUniversity(universityId);
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = dayStart.plusDays(1);
        LocalDateTime now = LocalDateTime.now();

        long todayCount = appointmentRepository.countTodayByUniversity(universityId, dayStart, dayEnd);
        long upcoming = appointmentRepository.countUpcomingByUniversity(universityId, now);

        return build(all, todayCount, upcoming, now);
    }

    private AppointmentStatsResponse build(
            List<Appointment> all, long todayCount, long upcoming, LocalDateTime now) {

        long completed = all.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .count();
        long cancelled = all.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED)
                .count();

        // Find next upcoming
        Appointment next = all.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.BOOKED)
                .filter(a -> a.getSlot() != null && a.getSlot().getStartTime() != null)
                .filter(a -> a.getSlot().getStartTime().isAfter(now))
                .min(Comparator.comparing(a -> a.getSlot().getStartTime()))
                .orElse(null);

        return AppointmentStatsResponse.builder()
                .total(all.size())
                .today(todayCount)
                .upcoming(upcoming)
                .completed(completed)
                .cancelled(cancelled)
                .nextStartTime(next != null ? next.getSlot().getStartTime().toString() : null)
                .nextStudentName(next != null && next.getStudent() != null
                        ? next.getStudent().getFullName() : null)
                .build();
    }
}