package com.uniqueeue.service;

import com.uniqueeue.dto.response.WorkflowAnalyticsResponse;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from:UniQueue <noreply@uniqueue.app>}")
    private String fromAddress;

    @Value("${app.email.reply-to:}")
    private String replyTo;

    @Value("${app.email.base-url:http://localhost:5173}")
    private String baseUrl;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    // ============================================================
    //  Low-level send — runs inside the caller's async thread.
    //  Not annotated @Async itself: annotating it would be a no-op
    //  for self-invocations (Spring proxies don't intercept same-class
    //  method calls). The public methods below carry @Async instead.
    // ============================================================

    private void sendHtml(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) return;

        if (!emailEnabled) {
            log.info("📧 [EMAIL DISABLED] to={} subject={}", to, subject);
            log.debug("📧 [EMAIL BODY]\n{}", htmlBody);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            if (replyTo != null && !replyTo.isBlank()) {
                helper.setReplyTo(replyTo);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("📧 Sent email to {} · {}", to, subject);
        } catch (Exception ex) {
            log.error("📧 Failed to send email to {} — {}", to, ex.getMessage());
        }
    }

    /**
     * Transactional emails (verification, password reset) always send.
     * Ticket notifications honour the user's `ticketEmailsEnabled` preference.
     */
    private boolean wantsTicketEmails(User user) {
        if (user == null) return false;
        return !Boolean.FALSE.equals(user.getTicketEmailsEnabled());
    }

    // ============================================================
    //  Ticket notifications — all @Async so nothing blocks the request
    // ============================================================

    @Async
    public void sendTicketCalled(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            if (!wantsTicketEmails(user)) {
                log.debug("Skipping ticket-called email — user {} disabled ticket emails", user.getId());
                return;
            }

            String subject = "🎫 It's your turn — Ticket " + ticket.getTicketNumber();

            String html = wrap(
                    user,
                    queue,
                    "It's your turn",
                    "Hi " + firstName(user) + ",<br><br>" +
                            "Your ticket is being called at <strong>" + escape(queue.getName()) + "</strong>. " +
                            "Please head to the service desk now.",
                    calloutBlock(
                            "Ticket number",
                            ticket.getTicketNumber(),
                            queue.getLocation() != null
                                    ? "Location: " + queue.getLocation()
                                    : null
                    ),
                    "Open my queue",
                    baseUrl + "/student/queues"
            );

            sendHtml(user.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendTicketCalled failed: {}", ex.getMessage());
        }
    }

    @Async
    public void sendTicketCompleted(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            if (!wantsTicketEmails(user)) {
                log.debug("Skipping ticket-completed email — user {} disabled ticket emails", user.getId());
                return;
            }

            String subject = "✅ Service complete — Ticket " + ticket.getTicketNumber();

            String html = wrap(
                    user,
                    queue,
                    "All done",
                    "Hi " + firstName(user) + ",<br><br>" +
                            "Your service at <strong>" + escape(queue.getName()) + "</strong> is complete. " +
                            "If you have a moment, please rate your experience.",
                    null,
                    "Rate your experience",
                    baseUrl + "/student/history"
            );

            sendHtml(user.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendTicketCompleted failed: {}", ex.getMessage());
        }
    }

    @Async
    public void sendTicketNoShow(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            if (!wantsTicketEmails(user)) {
                log.debug("Skipping ticket-no-show email — user {} disabled ticket emails", user.getId());
                return;
            }

            String subject = "⚠️ You missed your turn — Ticket " + ticket.getTicketNumber();

            String html = wrap(
                    user,
                    queue,
                    "You missed your turn",
                    "Hi " + firstName(user) + ",<br><br>" +
                            "Your ticket <strong>" + escape(ticket.getTicketNumber()) + "</strong> was marked as no-show " +
                            "because it wasn't served in time. You can join the queue again whenever you're ready.",
                    null,
                    "Rejoin the queue",
                    baseUrl + "/student/queues"
            );

            sendHtml(user.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendTicketNoShow failed: {}", ex.getMessage());
        }
    }

    @Async
    public void sendQueueClosed(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            if (!wantsTicketEmails(user)) {
                log.debug("Skipping queue-closed email — user {} disabled ticket emails", user.getId());
                return;
            }

            String subject = "🔒 Queue closed — Ticket " + ticket.getTicketNumber();

            String html = wrap(
                    user,
                    queue,
                    "The queue has closed",
                    "Hi " + firstName(user) + ",<br><br>" +
                            "<strong>" + escape(queue.getName()) + "</strong> closed for the day, " +
                            "so your waiting ticket was cancelled. You can rejoin when it reopens.",
                    null,
                    "Browse services",
                    baseUrl + "/student/queues"
            );

            sendHtml(user.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendQueueClosed failed: {}", ex.getMessage());
        }
    }

    // ============================================================
    //  Transactional emails — @Async so registration returns instantly
    // ============================================================

    /** @Async — returns immediately; SMTP happens in the background. */
    @Async
    public void sendVerificationCode(User user, String code) {
        try {
            if (user == null) return;

            String subject = "Your UniQueue verification code";

            String html = wrap(
                    user,
                    null,
                    "Verify your email",
                    "Hi " + firstName(user) + ",<br><br>" +
                            "Enter this 6-digit code to activate your UniQueue account. " +
                            "It expires in 24 hours.",
                    codeBlock(code),
                    null,
                    null
            );

            sendHtml(user.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendVerificationCode failed: {}", ex.getMessage());
        }
    }

    /** @Async — returns immediately; SMTP happens in the background. */
    @Async
    public void sendPasswordReset(User user, String token) {
        try {
            if (user == null) return;

            String resetUrl = baseUrl + "/reset-password?token=" + token;
            String subject = "Reset your UniQueue password";

            String html = wrap(
                    user,
                    null,
                    "Reset your password",
                    "Hi " + firstName(user) + ",<br><br>" +
                            "We received a request to reset your password. Click the button below to choose a new one. " +
                            "This link expires in 30 minutes. If you didn't request it, you can ignore this email.",
                    null,
                    "Reset password",
                    resetUrl
            );

            sendHtml(user.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendPasswordReset failed: {}", ex.getMessage());
        }
    }

    /** Admin-facing — @Async so bottleneck scans don't block the scheduler. */
    @Async
    public void sendBottleneckAlert(
            User admin,
            WorkflowAnalyticsResponse analytics,
            WorkflowAnalyticsResponse.StepAnalytics step) {

        try {
            if (admin == null || analytics == null || step == null) return;

            String workflowName = analytics.getWorkflowName() != null
                    ? analytics.getWorkflowName()
                    : "Workflow";

            String subject = "⚠️ Bottleneck alert — " + workflowName;

            String stepLabel = step.getLabel() != null && !step.getLabel().isBlank()
                    ? step.getLabel()
                    : (step.getQueueName() != null ? step.getQueueName() : "Step " + step.getOrder());

            String body = "Hi " + firstName(admin) + ",<br><br>" +
                    "We detected a bottleneck in <strong>" + escape(workflowName) + "</strong>. " +
                    "Students are spending significantly longer than usual at one step, " +
                    "and a growing number are currently waiting there.";

            String table = bottleneckTable(analytics, step, stepLabel);

            String analyticsUrl = baseUrl + "/admin/workflows/" + analytics.getWorkflowId() + "/analytics";

            String html = wrap(
                    admin,
                    null,
                    "Bottleneck detected",
                    body,
                    table,
                    "View analytics",
                    analyticsUrl
            );

            sendHtml(admin.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendBottleneckAlert failed: {}", ex.getMessage());
        }
    }

    // ============================================================
    //  HTML builders — unchanged
    // ============================================================

    private String wrap(User user, Queue queue, String heading, String body, String callout, String ctaLabel, String ctaUrl) {
        String uniName = user != null
                && user.getUniversity() != null
                && user.getUniversity().getName() != null
                ? user.getUniversity().getName()
                : "UniQueue";

        String accent = user != null
                && user.getUniversity() != null
                && user.getUniversity().getPrimaryColor() != null
                ? user.getUniversity().getPrimaryColor()
                : "#4f46e5";

        StringBuilder sb = new StringBuilder(2048);

        sb.append("<!DOCTYPE html><html><head><meta charset=\"utf-8\">")
                .append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">")
                .append("<title>").append(escape(heading)).append("</title></head>")
                .append("<body style=\"margin:0;padding:0;background:#f1f5f9;")
                .append("font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;")
                .append("color:#0f172a;\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f1f5f9;padding:40px 20px;\"><tr><td align=\"center\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"max-width:540px;background:#ffffff;border-radius:14px;overflow:hidden;")
                .append("box-shadow:0 1px 3px rgba(15,23,42,0.06),0 10px 30px rgba(15,23,42,0.04);\">");

        sb.append("<tr><td style=\"height:4px;background:").append(accent).append(";\"></td></tr>");

        sb.append("<tr><td style=\"padding:28px 32px 0 32px;\">")
                .append("<div style=\"font-size:11px;font-weight:700;letter-spacing:2px;")
                .append("text-transform:uppercase;color:").append(accent).append(";\">")
                .append("UniQueue · ").append(escape(uniName))
                .append("</div></td></tr>");

        sb.append("<tr><td style=\"padding:20px 32px 0 32px;\">")
                .append("<h1 style=\"margin:0;font-size:24px;line-height:1.3;font-weight:700;color:#0f172a;\">")
                .append(escape(heading)).append("</h1></td></tr>");

        sb.append("<tr><td style=\"padding:16px 32px 0 32px;font-size:15px;line-height:1.65;color:#475569;\">")
                .append(body).append("</td></tr>");

        if (callout != null) {
            sb.append("<tr><td style=\"padding:24px 32px 0 32px;\">").append(callout).append("</td></tr>");
        }

        if (ctaLabel != null && ctaUrl != null) {
            sb.append("<tr><td style=\"padding:28px 32px 0 32px;\">")
                    .append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\"><tr><td ")
                    .append("style=\"background:").append(accent).append(";border-radius:10px;\">")
                    .append("<a href=\"").append(escape(ctaUrl)).append("\" ")
                    .append("style=\"display:inline-block;padding:13px 26px;font-size:14px;font-weight:600;")
                    .append("color:#ffffff;text-decoration:none;\">")
                    .append(escape(ctaLabel)).append("</a></td></tr></table></td></tr>");
        }

        sb.append("<tr><td style=\"padding:32px 0 0 0;\"></td></tr>");

        sb.append("<tr><td style=\"padding:20px 32px 28px 32px;border-top:1px solid #e2e8f0;")
                .append("font-size:11px;line-height:1.5;color:#94a3b8;\">")
                .append("You're receiving this because you have a UniQueue account at ")
                .append(escape(uniName)).append(". If this wasn't you, please contact support.")
                .append("</td></tr>");

        sb.append("</table></td></tr></table></body></html>");

        return sb.toString();
    }

    private String calloutBlock(String label, String value, String secondary) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;\">")
                .append("<tr><td style=\"padding:16px 18px;\">")
                .append("<div style=\"font-size:10px;font-weight:700;letter-spacing:1.5px;")
                .append("text-transform:uppercase;color:#64748b;\">")
                .append(escape(label)).append("</div>")
                .append("<div style=\"margin-top:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;")
                .append("font-size:20px;font-weight:700;color:#0f172a;letter-spacing:0.5px;\">")
                .append(escape(value)).append("</div>");
        if (secondary != null) {
            sb.append("<div style=\"margin-top:6px;font-size:12px;color:#64748b;\">")
                    .append(escape(secondary)).append("</div>");
        }
        sb.append("</td></tr></table>");
        return sb.toString();
    }

    private String codeBlock(String code) {
        StringBuilder sb = new StringBuilder(256);
        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;\">")
                .append("<tr><td align=\"center\" style=\"padding:22px 18px;\">")
                .append("<div style=\"font-family:ui-monospace,SFMono-Regular,Menlo,monospace;")
                .append("font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;\">")
                .append(escape(code)).append("</div>")
                .append("</td></tr></table>");
        return sb.toString();
    }

    private String bottleneckTable(
            WorkflowAnalyticsResponse analytics,
            WorkflowAnalyticsResponse.StepAnalytics step,
            String stepLabel) {

        String sessionSuffix = analytics.getSession() != null
                ? " (" + escape(analytics.getSession()) + ")"
                : "";

        double avgHours = step.getAvgHoursOnStep() != null ? step.getAvgHoursOnStep() : 0;
        long stuck = step.getCurrentlyOnCount() != null ? step.getCurrentlyOnCount() : 0;
        long completed = step.getCompletedCount() != null ? step.getCompletedCount() : 0;

        StringBuilder sb = new StringBuilder(1024);

        sb.append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .append("style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;\">")
                .append("<tr><td style=\"padding:16px 18px;\">")
                .append(row("Workflow", escape(analytics.getWorkflowName()) + sessionSuffix))
                .append(row("Step", step.getOrder() + " — " + escape(stepLabel)))
                .append(row("Queue", escape(step.getQueueName())))
                .append(rowHighlighted("Students stuck", String.valueOf(stuck)))
                .append(rowHighlighted("Avg time per student", formatHours(avgHours)))
                .append(row("Already completed", String.valueOf(completed)))
                .append("</td></tr></table>");

        return sb.toString();
    }

    private String row(String label, String value) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                "style=\"margin:0 0 10px 0;\"><tr>" +
                "<td style=\"width:45%;padding:2px 0;font-size:12px;color:#64748b;vertical-align:top;\">"
                + escape(label) + "</td>" +
                "<td style=\"padding:2px 0;font-size:13px;font-weight:600;color:#0f172a;vertical-align:top;\">"
                + value + "</td>" +
                "</tr></table>";
    }

    private String rowHighlighted(String label, String value) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                "style=\"margin:0 0 10px 0;\"><tr>" +
                "<td style=\"width:45%;padding:2px 0;font-size:12px;color:#64748b;vertical-align:top;\">"
                + escape(label) + "</td>" +
                "<td style=\"padding:2px 0;font-size:15px;font-weight:700;color:#dc2626;vertical-align:top;\">"
                + value + "</td>" +
                "</tr></table>";
    }

    private String formatHours(double hours) {
        if (hours < 48) {
            return String.format("%.1f hours", hours);
        }
        double days = hours / 24.0;
        return String.format("%.1f days", days);
    }

    private String firstName(User user) {
        if (user.getFullName() == null) return "there";
        String[] parts = user.getFullName().trim().split("\\s+");
        return parts.length > 0 ? parts[0] : "there";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}