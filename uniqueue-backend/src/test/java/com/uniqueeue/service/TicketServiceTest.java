package com.uniqueeue.service;

import com.uniqueeue.TestFixtures;
import com.uniqueeue.dto.response.TicketResponse;
import com.uniqueeue.enums.TicketStatus;
import com.uniqueeue.exception.BadRequestException;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TicketServiceTest {

    @Autowired TicketService ticketService;
    @Autowired TicketRepository ticketRepository;
    @Autowired TestFixtures fixtures;

    // Prevent real emails / Web Push during tests
    @MockitoBean EmailService emailService;
    @MockitoBean AsyncPushService asyncPushService;

    private User student;
    private User staff;
    private Queue pay;
    private Queue reg;

    @BeforeEach
    void setup() {
        TestFixtures.Fixture f = fixtures.build();
        student = f.student();
        staff = f.staff();
        pay = f.payQueue();
        reg = f.regQueue();
    }

    // ─── JOIN ─────────────────────────────────────────────────

    @Test
    @DisplayName("joinQueue with a valid student + queue creates a WAITING ticket")
    void joinQueue_createsWaitingTicket() {
        TicketResponse res = ticketService.joinQueue(student.getId(), pay.getId());

        assertThat(res.getId()).isNotNull();
        assertThat(res.getStatus()).isEqualTo(TicketStatus.WAITING);
        assertThat(res.getTicketNumber()).isNotBlank();
        assertThat(res.getQueueId()).isEqualTo(pay.getId());
    }

    @Test
    @DisplayName("joinQueue while another ticket is active throws")
    void joinQueue_whenActiveTicketExists_throws() {
        ticketService.joinQueue(student.getId(), pay.getId());

        assertThatThrownBy(() -> ticketService.joinQueue(student.getId(), reg.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already have an active ticket");
    }

    // ─── CALL NEXT ────────────────────────────────────────────

    @Test
    @DisplayName("callNext sets the first waiting ticket to CALLED")
    void callNext_marksFirstWaitingAsCalled() {
        ticketService.joinQueue(student.getId(), pay.getId());

        TicketResponse called = ticketService.callNext(staff.getId(), pay.getId());

        assertThat(called.getStatus()).isEqualTo(TicketStatus.CALLED);
        assertThat(called.getCalledAt()).isNotNull();
    }

    @Test
    @DisplayName("callNext when a ticket is already CALLED throws")
    void callNext_whenAlreadyCalled_throws() {
        ticketService.joinQueue(student.getId(), pay.getId());
        ticketService.callNext(staff.getId(), pay.getId());

        assertThatThrownBy(() -> ticketService.callNext(staff.getId(), pay.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already being called");
    }

    @Test
    @DisplayName("callNext on an empty queue throws")
    void callNext_whenNoWaiting_throws() {
        assertThatThrownBy(() -> ticketService.callNext(staff.getId(), pay.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No waiting tickets");
    }

    // ─── SERVE ────────────────────────────────────────────────

    @Test
    @DisplayName("serveTicket moves CALLED → SERVING")
    void serveTicket_movesToServing() {
        ticketService.joinQueue(student.getId(), pay.getId());
        TicketResponse called = ticketService.callNext(staff.getId(), pay.getId());

        TicketResponse served = ticketService.serveTicket(staff.getId(), called.getId());

        assertThat(served.getStatus()).isEqualTo(TicketStatus.SERVING);
    }

    @Test
    @DisplayName("serveTicket on a WAITING ticket throws")
    void serveTicket_fromWaiting_throws() {
        TicketResponse joined = ticketService.joinQueue(student.getId(), pay.getId());

        assertThatThrownBy(() -> ticketService.serveTicket(staff.getId(), joined.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only CALLED tickets");
    }

    // ─── COMPLETE ─────────────────────────────────────────────

    @Test
    @DisplayName("completeTicket from SERVING marks the ticket COMPLETED")
    void completeTicket_fromServing_marksCompleted() {
        ticketService.joinQueue(student.getId(), pay.getId());
        TicketResponse called = ticketService.callNext(staff.getId(), pay.getId());
        ticketService.serveTicket(staff.getId(), called.getId());

        TicketResponse completed = ticketService.completeTicket(staff.getId(), called.getId());

        assertThat(completed.getStatus()).isEqualTo(TicketStatus.COMPLETED);
        assertThat(completed.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("completeTicket from CALLED is rejected (must serve first)")
    void completeTicket_fromCalled_throws() {
        ticketService.joinQueue(student.getId(), pay.getId());
        TicketResponse called = ticketService.callNext(staff.getId(), pay.getId());

        assertThatThrownBy(() -> ticketService.completeTicket(staff.getId(), called.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Start the service");
    }

    // ─── NO-SHOW ──────────────────────────────────────────────

    @Test
    @DisplayName("noShowTicket from WAITING marks NO_SHOW")
    void noShowTicket_fromWaiting_marksNoShow() {
        TicketResponse joined = ticketService.joinQueue(student.getId(), pay.getId());

        TicketResponse res = ticketService.noShowTicket(staff.getId(), joined.getId());

        assertThat(res.getStatus()).isEqualTo(TicketStatus.NO_SHOW);
    }

    // ─── HAPPY PATH ───────────────────────────────────────────

    @Test
    @DisplayName("Full lifecycle: join → call → serve → complete")
    void fullLifecycle() {
        TicketResponse joined = ticketService.joinQueue(student.getId(), pay.getId());
        assertThat(joined.getStatus()).isEqualTo(TicketStatus.WAITING);

        TicketResponse called = ticketService.callNext(staff.getId(), pay.getId());
        assertThat(called.getStatus()).isEqualTo(TicketStatus.CALLED);

        TicketResponse served = ticketService.serveTicket(staff.getId(), called.getId());
        assertThat(served.getStatus()).isEqualTo(TicketStatus.SERVING);

        TicketResponse completed = ticketService.completeTicket(staff.getId(), called.getId());
        assertThat(completed.getStatus()).isEqualTo(TicketStatus.COMPLETED);

        // Verify what's actually in the DB
        List<Ticket> all = ticketRepository.findByUserIdOrderByJoinedAtDesc(student.getId());
        assertThat(all).hasSize(1);
        assertThat(all.get(0).getStatus()).isEqualTo(TicketStatus.COMPLETED);
    }
}