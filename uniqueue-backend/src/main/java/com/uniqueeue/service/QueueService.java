package com.uniqueeue.service;

import com.uniqueeue.dto.request.CreateQueueRequest;
import com.uniqueeue.dto.request.CreateStaffRequest;
import com.uniqueeue.dto.request.UpdateQueueRequest;
import com.uniqueeue.dto.response.QueueResponse;
import com.uniqueeue.enums.AuditAction;
import com.uniqueeue.enums.Role;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.exception.ResourceNotFoundException;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.QueueStaff;
import com.uniqueeue.model.University;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.QueueRepository;
import com.uniqueeue.repository.QueueStaffRepository;
import com.uniqueeue.repository.TicketRepository;
import com.uniqueeue.repository.UniversityRepository;
import com.uniqueeue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QueueService {

    private final QueueRepository queueRepository;
    private final QueueStaffRepository queueStaffRepository;
    private final UniversityRepository universityRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    // ============================================================
    //  QUEUES
    // ============================================================

    @Transactional(readOnly = true)
    public List<QueueResponse> listQueues(Long universityId, boolean onlyActive) {
        List<Queue> queues = onlyActive
                ? queueRepository.findByUniversityIdAndIsActiveTrue(universityId)
                : queueRepository.findByUniversityId(universityId);
        return queues.stream().map(this::enrichWithStaff).toList();
    }

    @Transactional(readOnly = true)
    public QueueResponse getQueue(Long queueId, Long universityId) {
        Queue queue = queueRepository.findByIdAndUniversityId(queueId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));
        return enrichWithStaff(queue);
    }

    @Transactional
    public QueueResponse createQueue(Long universityId, Long adminUserId, CreateQueueRequest request) {
        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        Queue queue = Queue.builder()
                .university(university)
                .name(request.getName())
                .description(request.getDescription())
                .department(request.getDepartment() != null ? request.getDepartment().trim() : null)
                .subDepartment(request.getSubDepartment() != null ? request.getSubDepartment().trim() : null)
                .location(request.getLocation())
                .opensAt(request.getOpensAt() != null ? request.getOpensAt() : LocalTime.of(8, 0))
                .closesAt(request.getClosesAt() != null ? request.getClosesAt() : LocalTime.of(17, 0))
                .maxCapacity(request.getMaxCapacity() != null ? request.getMaxCapacity() : 100)
                .averageServiceMinutes(request.getAverageServiceMinutes() != null
                        ? request.getAverageServiceMinutes() : 5)
                .allowWaitlist(request.getAllowWaitlist() != null ? request.getAllowWaitlist() : false)
                .autoPromoteWaitlist(request.getAutoPromoteWaitlist() != null
                        ? request.getAutoPromoteWaitlist() : true)
                .maxWaitlistSize(request.getMaxWaitlistSize() != null ? request.getMaxWaitlistSize() : 100)
                .isActive(true)
                .createdBy(admin)
                .build();

        Queue saved = queueRepository.save(queue);

        auditService.record(adminUserId, universityId,
                AuditAction.QUEUE_CREATED, "Queue", saved.getId(),
                "{\"name\":\"" + saved.getName() + "\"}");

        return enrichWithStaff(saved);
    }

    @Transactional
    public QueueResponse updateQueue(Long queueId, Long universityId, UpdateQueueRequest request) {
        Queue queue = queueRepository.findByIdAndUniversityId(queueId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));

        if (request.getName() != null) queue.setName(request.getName());
        if (request.getDescription() != null) queue.setDescription(request.getDescription());
        if (request.getDepartment() != null) queue.setDepartment(request.getDepartment().trim());
        if (request.getSubDepartment() != null) queue.setSubDepartment(request.getSubDepartment().trim());
        if (request.getLocation() != null) queue.setLocation(request.getLocation());
        if (request.getIsActive() != null) queue.setIsActive(request.getIsActive());
        if (request.getOpensAt() != null) queue.setOpensAt(request.getOpensAt());
        if (request.getClosesAt() != null) queue.setClosesAt(request.getClosesAt());
        if (request.getMaxCapacity() != null) queue.setMaxCapacity(request.getMaxCapacity());
        if (request.getAverageServiceMinutes() != null) queue.setAverageServiceMinutes(request.getAverageServiceMinutes());
        if (request.getAllowWaitlist() != null) queue.setAllowWaitlist(request.getAllowWaitlist());
        if (request.getAutoPromoteWaitlist() != null) queue.setAutoPromoteWaitlist(request.getAutoPromoteWaitlist());
        if (request.getMaxWaitlistSize() != null) queue.setMaxWaitlistSize(request.getMaxWaitlistSize());

        Queue saved = queueRepository.save(queue);

        auditService.record(null, universityId,
                AuditAction.QUEUE_UPDATED, "Queue", queueId, null);

        return enrichWithStaff(saved);
    }

    @Transactional
    public void deleteQueue(Long queueId, Long universityId) {
        Queue queue = queueRepository.findByIdAndUniversityId(queueId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));
        queueStaffRepository.deleteAll(queueStaffRepository.findByQueueId(queueId));
        queueRepository.delete(queue);

        auditService.record(null, universityId,
                AuditAction.QUEUE_DELETED, "Queue", queueId,
                "{\"name\":\"" + queue.getName() + "\"}");
    }

    // ============================================================
    //  STAFF
    // ============================================================

    @Transactional
    public QueueResponse.StaffInfo createStaff(Long universityId, CreateStaffRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new BadRequestException("Email already in use");
        }

        University university = universityRepository.findById(universityId)
                .orElseThrow(() -> new ResourceNotFoundException("University not found"));

        User staff = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.STAFF)
                .university(university)
                .department(request.getDepartment())
                .phone(request.getPhone())
                .isActive(true)
                .isVerified(true)
                .build();

        User saved = userRepository.save(staff);

        auditService.record(null, universityId,
                AuditAction.STAFF_CREATED, "User", saved.getId(),
                "{\"email\":\"" + saved.getEmail() + "\"}");

        return QueueResponse.StaffInfo.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .build();
    }

    @Transactional
    public QueueResponse assignStaff(Long queueId, Long universityId, Long staffUserId) {
        Queue queue = queueRepository.findByIdAndUniversityId(queueId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));

        User staff = userRepository.findById(staffUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found"));

        if (staff.getRole() != Role.STAFF) {
            throw new BadRequestException("User is not a staff member");
        }
        if (staff.getUniversity() == null || !staff.getUniversity().getId().equals(universityId)) {
            throw new BadRequestException("Staff does not belong to your university");
        }
        if (queueStaffRepository.existsByQueueIdAndUserId(queueId, staffUserId)) {
            throw new BadRequestException("Staff already assigned to this queue");
        }

        queueStaffRepository.save(QueueStaff.builder().queue(queue).user(staff).build());

        auditService.record(null, universityId,
                AuditAction.STAFF_ASSIGNED, "QueueStaff", queueId,
                "{\"staffId\":" + staffUserId + ",\"queueId\":" + queueId + "}");

        return enrichWithStaff(queue);
    }

    @Transactional
    public QueueResponse unassignStaff(Long queueId, Long universityId, Long staffUserId) {
        Queue queue = queueRepository.findByIdAndUniversityId(queueId, universityId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));

        if (!queueStaffRepository.existsByQueueIdAndUserId(queueId, staffUserId)) {
            throw new ResourceNotFoundException("Assignment not found");
        }
        queueStaffRepository.deleteByQueueIdAndUserId(queueId, staffUserId);

        auditService.record(null, universityId,
                AuditAction.STAFF_UNASSIGNED, "QueueStaff", queueId,
                "{\"staffId\":" + staffUserId + ",\"queueId\":" + queueId + "}");

        return enrichWithStaff(queue);
    }

    @Transactional(readOnly = true)
    public List<QueueResponse.StaffInfo> listStaff(Long universityId) {
        return userRepository.findByUniversityIdAndRole(universityId, Role.STAFF).stream()
                .map(u -> QueueResponse.StaffInfo.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .build())
                .toList();
    }

    // ============================================================
    //  HELPERS
    // ============================================================

    private QueueResponse enrichWithStaff(Queue queue) {
        QueueResponse response = QueueResponse.from(queue);

        List<QueueStaff> assignments = queueStaffRepository.findByQueueId(queue.getId());
        List<QueueResponse.StaffInfo> staffList = assignments.stream()
                .map(qs -> QueueResponse.StaffInfo.builder()
                        .id(qs.getUser().getId())
                        .fullName(qs.getUser().getFullName())
                        .email(qs.getUser().getEmail())
                        .build())
                .toList();
        response.setStaff(staffList);
        response.setStaffCount(staffList.size());

        long waiting = ticketRepository.countByQueueAndStatus(queue.getId(), TicketStatus.WAITING);
        long waitlisted = ticketRepository.countByQueueAndStatus(queue.getId(), TicketStatus.WAITLISTED);
        response.setWaitingCount(waiting);
        response.setWaitlistCount(waitlisted);

        List<com.uniqueeue.model.Ticket> called =
                ticketRepository.findCalledByQueueId(queue.getId());
        response.setCurrentlyServing(called.isEmpty() ? null : called.get(0).getTicketNumber());

        int avg = queue.getAverageServiceMinutes() != null ? queue.getAverageServiceMinutes() : 5;
        response.setEstimatedMinutes((int) (waiting * avg));

        return response;
    }
}