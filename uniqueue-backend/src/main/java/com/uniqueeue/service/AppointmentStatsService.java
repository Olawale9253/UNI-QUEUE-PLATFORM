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
                .filter(appointmentValue -> appointmentValue.getStatus() == AppointmentStatus.BOOKED)
                .filter(appointmentValue2 -> appointmentValue2.getSlot() != null && appointmentValue2.getSlot().getStartTime() != null)
                .filter(appointmentValue3 -> appointmentValue3.getSlot().getStartTime().toLocalDate().equals(today))
                .count();

        long upcoming = all.stream()
                .filter(appointmentValue4 -> appointmentValue4.getStatus() == AppointmentStatus.BOOKED)
                .filter(appointmentValue5 -> appointmentValue5.getSlot() != null && appointmentValue5.getSlot().getStartTime() != null)
                .filter(appointmentValue6 -> appointmentValue6.getSlot().getStartTime().isAfter(now))
                .count();

        Appointment next = all.stream()
                .filter(appointmentValue7 -> appointmentValue7.getStatus() == AppointmentStatus.BOOKED)
                .filter(appointmentValue8 -> appointmentValue8.getSlot() != null && appointmentValue8.getSlot().getStartTime() != null)
                .filter(appointmentValue9 -> appointmentValue9.getSlot().getStartTime().isAfter(now))
                .min(Comparator.comparing(appointmentValue10 -> appointmentValue10.getSlot().getStartTime()))
                .orElse(null);

        return AppointmentStatsResponse.builder()
                .total(all.size())
                .today(todayCount)
                .upcoming(upcoming)
                .completed(all.stream()
                        .filter(appointmentValue11 -> appointmentValue11.getStatus() == AppointmentStatus.COMPLETED)
                        .count())
                .cancelled(all.stream()
                        .filter(appointmentValue12 -> appointmentValue12.getStatus() == AppointmentStatus.CANCELLED)
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
                .filter(appointmentValue13 -> appointmentValue13.getSlot() != null && appointmentValue13.getSlot().getStartTime() != null)
                .filter(appointmentValue14 -> appointmentValue14.getSlot().getStartTime().toLocalDate().equals(today))
                .count();

        long upcoming = all.stream()
                .filter(appointmentValue15 -> appointmentValue15.getStatus() == AppointmentStatus.BOOKED)
                .filter(appointmentValue16 -> appointmentValue16.getSlot() != null && appointmentValue16.getSlot().getStartTime() != null)
                .filter(appointmentValue17 -> appointmentValue17.getSlot().getStartTime().isAfter(now))
                .count();

        return AppointmentStatsResponse.builder()
                .total(all.size())
                .today(todayCount)
                .upcoming(upcoming)
                .completed(all.stream()
                        .filter(appointmentValue18 -> appointmentValue18.getStatus() == AppointmentStatus.COMPLETED)
                        .count())
                .cancelled(all.stream()
                        .filter(appointmentValue19 -> appointmentValue19.getStatus() == AppointmentStatus.CANCELLED)
                        .count())
                .build();
    }
}