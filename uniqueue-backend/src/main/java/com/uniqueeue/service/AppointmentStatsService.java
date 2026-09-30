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
        LocalDateTime now = LocalDateTime.now();

        long todayCount = all.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.BOOKED)
                .filter(a -> a.getSlot() != null && a.getSlot().getStartTime() != null)
                .filter(a -> a.getSlot().getStartTime().toLocalDate().equals(today))
                .count();

        long upcoming = all.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.BOOKED)
                .filter(a -> a.getSlot() != null && a.getSlot().getStartTime() != null)
                .filter(a -> a.getSlot().getStartTime().isAfter(now))
                .count();

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
                .completed(all.stream()
                        .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                        .count())
                .cancelled(all.stream()
                        .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED)
                        .count())
                .nextStartTime(next != null ? next.getSlot().getStartTime().toString() : null)
                .nextStudentName(next != null && next.getStudent() != null
                        ? next.getStudent().getFullName() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public AppointmentStatsResponse forUniversity(Long universityId) {
        List<Appointment> all = appointmentRepository.findByUniversity(universityId);
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        long todayCount = all.stream()
                .filter(a -> a.getSlot() != null && a.getSlot().getStartTime() != null)
                .filter(a -> a.getSlot().getStartTime().toLocalDate().equals(today))
                .count();

        long upcoming = all.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.BOOKED)
                .filter(a -> a.getSlot() != null && a.getSlot().getStartTime() != null)
                .filter(a -> a.getSlot().getStartTime().isAfter(now))
                .count();

        return AppointmentStatsResponse.builder()
                .total(all.size())
                .today(todayCount)
                .upcoming(upcoming)
                .completed(all.stream()
                        .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                        .count())
                .cancelled(all.stream()
                        .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED)
                        .count())
                .build();
    }
}