package com.uniqueeue.service;

import com.uniqueeue.dto.request.BookAppointmentRequest;
import com.uniqueeue.dto.request.CreateAppointmentSlotRequest;
import com.uniqueeue.dto.request.UpdateAppointmentSlotRequest;
import com.uniqueeue.dto.response.AppointmentResponse;
import com.uniqueeue.dto.response.AppointmentSlotResponse;
import com.uniqueeue.enums.AppointmentStatus;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.NotificationType;
import com.uniqueeue.enums.Role;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Appointment;
import com.uniqueeue.model.AppointmentSlot;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.AppointmentRepository;
import com.uniqueeue.repository.AppointmentSlotRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentSlotRepository slotRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    // ============================================================
    //  SLOTS — staff-managed
    // ============================================================

    @Transactional
    public AppointmentSlotResponse createSlot(Long staffId, CreateAppointmentSlotRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (staff.getRole() != Role.STAFF && staff.getRole() != Role.ADMIN) {
            throw new BadRequestException("Only staff or admins can offer appointment slots");
        }
        if (staff.getUniversity() == null) {
            throw new BadRequestException("You must belong to a university");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new BadRequestException("Start and end times are required");
        }
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }
        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Slot cannot start in the past");
        }

        AppointmentSlot slot = AppointmentSlot.builder()
                .university(staff.getUniversity())
                .staff(staff)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory() != null
                        ? request.getCategory()
                        : com.uniqueeue.enums.AppointmentCategory.OTHER)
                .faculty(request.getFaculty())
                .department(request.getDepartment())
                .location(request.getLocation())
                .roomDetail(request.getRoomDetail())
                .staffRole(request.getStaffRole())
                .durationMinutes(request.getDurationMinutes() != null
                        ? request.getDurationMinutes() : 30)
                .whatToBring(request.getWhatToBring())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .capacity(request.getCapacity() != null ? request.getCapacity() : 1)
                .isActive(true)
                .build();

        AppointmentSlot saved = slotRepository.save(slot);

        auditService.record(staffId, staff.getUniversity().getId(),
                AuditAction.APPOINTMENT_SLOT_CREATED, "AppointmentSlot", saved.getId(),
                "{\"title\":\"" + saved.getTitle() + "\",\"start\":\"" + saved.getStartTime() + "\"}");

        return AppointmentSlotResponse.from(saved, 0L);
    }

    @Transactional(readOnly = true)
    public List<AppointmentSlotResponse> listSlotsForStaff(Long staffId) {
        return slotRepository.findByStaffIdOrderByStartTimeAsc(staffId).stream()
                .map(s -> AppointmentSlotResponse.from(s, bookedCount(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentSlotResponse getSlot(Long slotId, Long requestingUserId) {
        AppointmentSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        return AppointmentSlotResponse.from(slot, bookedCount(slotId));
    }

    @Transactional
    public AppointmentSlotResponse updateSlot(Long staffId, Long slotId, UpdateAppointmentSlotRequest request) {
        AppointmentSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        if (!slot.getStaff().getId().equals(staffId)) {
            throw new BadRequestException("Not your slot");
        }
        if (request.getTitle() != null) slot.setTitle(request.getTitle());
        if (request.getDescription() != null) slot.setDescription(request.getDescription());
        if (request.getLocation() != null) slot.setLocation(request.getLocation());
        if (request.getStartTime() != null) slot.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) slot.setEndTime(request.getEndTime());
        if (request.getCapacity() != null) {
            long booked = bookedCount(slotId);
            if (request.getCapacity() < booked) {
                throw new BadRequestException("Capacity can't be less than already booked count (" + booked + ")");
            }
            slot.setCapacity(request.getCapacity());
        }
        if (request.getIsActive() != null) slot.setIsActive(request.getIsActive());

        AppointmentSlot saved = slotRepository.save(slot);

        auditService.record(staffId, slot.getUniversity().getId(),
                AuditAction.APPOINTMENT_SLOT_UPDATED, "AppointmentSlot", slotId, null);

        return AppointmentSlotResponse.from(saved, bookedCount(slotId));
    }

    @Transactional
    public void deleteSlot(Long staffId, Long slotId) {
        AppointmentSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        if (!slot.getStaff().getId().equals(staffId)) {
            throw new BadRequestException("Not your slot");
        }
        if (bookedCount(slotId) > 0) {
            throw new BadRequestException("Cannot delete a slot with active bookings. Cancel them first or deactivate the slot.");
        }
        slotRepository.delete(slot);

        auditService.record(staffId, slot.getUniversity().getId(),
                AuditAction.APPOINTMENT_SLOT_DELETED, "AppointmentSlot", slotId,
                "{\"title\":\"" + slot.getTitle() + "\"}");
    }

    // ============================================================
    //  SLOTS — student view
    // ============================================================

    @Transactional(readOnly = true)
    public List<AppointmentSlotResponse> listAvailableSlotsForStudent(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (student.getUniversity() == null) return List.of();

        return slotRepository.findAvailableByUniversity(student.getUniversity().getId(), LocalDateTime.now())
                .stream()
                .map(s -> AppointmentSlotResponse.from(s, bookedCount(s.getId())))
                .filter(r -> !"FULL".equals(r.getStatus()))
                .toList();
    }

    // ============================================================
    //  BOOKINGS — student
    // ============================================================

    @Transactional
    public AppointmentResponse book(Long studentId, BookAppointmentRequest request) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        AppointmentSlot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        if (student.getUniversity() == null
                || !student.getUniversity().getId().equals(slot.getUniversity().getId())) {
            throw new BadRequestException("Slot is not in your university");
        }
        if (!Boolean.TRUE.equals(slot.getIsActive())) {
            throw new BadRequestException("Slot is not active");
        }
        if (slot.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Slot has already started");
        }

        long booked = bookedCount(slot.getId());
        if (booked >= slot.getCapacity()) {
            throw new BadRequestException("Slot is full");
        }

        // Prevent student from having overlapping appointments
        long overlap = appointmentRepository.countOverlapping(
                studentId, slot.getStartTime(), slot.getEndTime());
        if (overlap > 0) {
            throw new BadRequestException("You already have an appointment overlapping this time");
        }

        Appointment appt = Appointment.builder()
                .slot(slot)
                .student(student)
                .status(AppointmentStatus.BOOKED)
                .notes(request.getNotes())
                .build();

        Appointment saved = appointmentRepository.save(appt);

        // Notify student
        notificationService.notify(student, NotificationType.SYSTEM,
                "Appointment booked",
                "You booked " + slot.getTitle() + " with " + slot.getStaff().getFullName()
                        + " on " + slot.getStartTime() + " at " + slot.getLocation() + ".");

        // Notify staff
        notificationService.notify(slot.getStaff(), NotificationType.SYSTEM,
                "New appointment booking",
                student.getFullName() + " (" + student.getMatricNumber() + ") booked your slot \""
                        + slot.getTitle() + "\" on " + slot.getStartTime() + ".");

        auditService.record(studentId, slot.getUniversity().getId(),
                AuditAction.APPOINTMENT_BOOKED, "Appointment", saved.getId(),
                "{\"slotId\":" + slot.getId() + "}");

        return AppointmentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listMine(Long studentId) {
        return appointmentRepository.findByStudentIdOrderByBookedAtDesc(studentId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listUpcoming(Long studentId) {
        return appointmentRepository.findUpcomingByStudent(studentId, LocalDateTime.now()).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional
    public AppointmentResponse cancelByStudent(Long studentId, Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appt.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("Not your appointment");
        }
        if (appt.getStatus() != AppointmentStatus.BOOKED) {
            throw new BadRequestException("Cannot cancel an appointment that is " + appt.getStatus());
        }
        if (appt.getSlot().getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot cancel — appointment has already started");
        }

        appt.setStatus(AppointmentStatus.CANCELLED);
        appt.setCancelledAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appt);

        notificationService.notify(appt.getSlot().getStaff(), NotificationType.SYSTEM,
                "Appointment cancelled",
                appt.getStudent().getFullName() + " cancelled their appointment \"" +
                        appt.getSlot().getTitle() + "\" on " + appt.getSlot().getStartTime() + ".");

        auditService.record(studentId, appt.getSlot().getUniversity().getId(),
                AuditAction.APPOINTMENT_CANCELLED, "Appointment", appointmentId, null);

        return AppointmentResponse.from(saved);
    }

    // ============================================================
    //  BOOKINGS — staff
    // ============================================================

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listAppointmentsForSlot(Long staffId, Long slotId) {
        AppointmentSlot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        if (!slot.getStaff().getId().equals(staffId)) {
            throw new BadRequestException("Not your slot");
        }
        return appointmentRepository.findBySlotIdOrderByBookedAtAsc(slotId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional
    public AppointmentResponse completeByStaff(Long staffId, Long appointmentId, String staffNotes) {
        Appointment appt = mustOwn(staffId, appointmentId);
        if (appt.getStatus() != AppointmentStatus.BOOKED) {
            throw new BadRequestException("Only BOOKED appointments can be completed");
        }
        appt.setStatus(AppointmentStatus.COMPLETED);
        appt.setCompletedAt(LocalDateTime.now());
        if (staffNotes != null) appt.setStaffNotes(staffNotes);
        Appointment saved = appointmentRepository.save(appt);

        notificationService.notify(appt.getStudent(), NotificationType.SYSTEM,
                "Appointment complete",
                "Your appointment \"" + appt.getSlot().getTitle() + "\" is marked as completed.");

        auditService.record(staffId, appt.getSlot().getUniversity().getId(),
                AuditAction.APPOINTMENT_COMPLETED, "Appointment", appointmentId, null);

        return AppointmentResponse.from(saved);
    }

    @Transactional
    public AppointmentResponse noShowByStaff(Long staffId, Long appointmentId) {
        Appointment appt = mustOwn(staffId, appointmentId);
        if (appt.getStatus() != AppointmentStatus.BOOKED) {
            throw new BadRequestException("Only BOOKED appointments can be marked no-show");
        }
        appt.setStatus(AppointmentStatus.NO_SHOW);
        appt.setCompletedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appt);

        notificationService.notify(appt.getStudent(), NotificationType.SYSTEM,
                "You missed your appointment",
                "Appointment \"" + appt.getSlot().getTitle() + "\" was marked as a no-show.");

        auditService.record(staffId, appt.getSlot().getUniversity().getId(),
                AuditAction.APPOINTMENT_NO_SHOW, "Appointment", appointmentId, null);

        return AppointmentResponse.from(saved);
    }

    // ============================================================
    //  ADMIN
    // ============================================================

    @Transactional(readOnly = true)
    public List<AppointmentSlotResponse> listSlotsForUniversity(Long universityId) {
        return slotRepository.findByUniversityIdOrderByStartTimeAsc(universityId).stream()
                .map(s -> AppointmentSlotResponse.from(s, bookedCount(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listAppointmentsForUniversity(Long universityId) {
        return appointmentRepository.findByUniversity(universityId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private long bookedCount(Long slotId) {
        return appointmentRepository.countBySlotIdAndStatus(slotId, AppointmentStatus.BOOKED);
    }

    private Appointment mustOwn(Long staffId, Long appointmentId) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        if (appt.getSlot() == null || appt.getSlot().getStaff() == null
                || !appt.getSlot().getStaff().getId().equals(staffId)) {
            throw new BadRequestException("Not your appointment");
        }
        return appt;
    }
}