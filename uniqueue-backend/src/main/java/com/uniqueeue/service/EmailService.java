package com.uniqueeue.service;

import com.uniqueeue.dto.response.WorkflowAnalyticsResponse;
import com.uniqueeue.model.Queue;
import com.uniqueeue.model.Ticket;
import com.uniqueeue.model.User;
import com.uniqueeue.repository.UserRepository; // 🔧 Added import
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // 🔧 Added import
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final UserRepository userRepository; // 🔧 Added to re-fetch user

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.email.from:UniQueue <noreply@uniqueue.app>}")
    private String fromAddress;

    @Value("${app.email.reply-to:}")
    private String replyTo;

    @Value("${app.email.base-url:http://localhost:5173}")
    private String baseUrl;

    @Value("${app.email.brevo-api-key:}")
    private String brevoApiKey;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private void sendHtml(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) return;

        if (!emailEnabled || brevoApiKey == null || brevoApiKey.isEmpty()) {
            log.info("📧 [EMAIL DISABLED OR NO API KEY] to={} subject={}", to, subject);
            return;
        }

        try {
            String senderEmail = fromAddress;
            String senderName = "UniQueue";
            if (fromAddress.contains("<") && fromAddress.contains(">")) {
                senderName = fromAddress.substring(0, fromAddress.indexOf("<")).trim();
                senderEmail = fromAddress.substring(fromAddress.indexOf("<") + 1, fromAddress.indexOf(">")).trim();
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("sender", Map.of("name", senderName, "email", senderEmail));
            payload.put("to", List.of(Map.of("email", to)));
            payload.put("subject", subject);
            payload.put("htmlContent", htmlBody);

            if (replyTo != null && !replyTo.isBlank()) {
                payload.put("replyTo", Map.of("email", replyTo));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);
            headers.set("accept", "application/json");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(BREVO_API_URL, request, String.class);
            log.info("📧 Sent email via HTTP API to {} · {}", to, subject);

        } catch (Exception ex) {
            log.error("📧 Failed to send email to {} — {}", to, ex.getMessage(), ex);
        }
    }

    private boolean wantsTicketEmails(User user) {
        if (user == null) return false;
        return !Boolean.FALSE.equals(user.getTicketEmailsEnabled());
    }

    // 🔧 FIX: Re-fetch user in a new transaction to prevent "Statement has been closed"
    @Async
    @Transactional(readOnly = true)
    public void sendTicketCalled(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            User freshUser = userRepository.findById(user.getId()).orElse(user);
            if (!wantsTicketEmails(freshUser)) return;

            String subject = "🎫 It's your turn — Ticket " + ticket.getTicketNumber();
            String html = wrap(freshUser, queue, "It's your turn",
                    "Hi " + firstName(freshUser) + ",<br><br>Your ticket is being called at <strong>" + escape(queue.getName()) + "</strong>. Please head to the service desk now.",
                    calloutBlock("Ticket number", ticket.getTicketNumber(), queue.getLocation() != null ? "Location: " + queue.getLocation() : null),
                    "Open my queue", baseUrl + "/student/queues");

            sendHtml(freshUser.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendTicketCalled failed: {}", ex.getMessage());
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendTicketCompleted(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            User freshUser = userRepository.findById(user.getId()).orElse(user);
            if (!wantsTicketEmails(freshUser)) return;

            String subject = "✅ Service complete — Ticket " + ticket.getTicketNumber();
            String html = wrap(freshUser, queue, "All done",
                    "Hi " + firstName(freshUser) + ",<br><br>Your service at <strong>" + escape(queue.getName()) + "</strong> is complete. If you have a moment, please rate your experience.",
                    null, "Rate your experience", baseUrl + "/student/history");

            sendHtml(freshUser.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendTicketCompleted failed: {}", ex.getMessage());
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendTicketNoShow(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            User freshUser = userRepository.findById(user.getId()).orElse(user);
            if (!wantsTicketEmails(freshUser)) return;

            String subject = "⚠️ You missed your turn — Ticket " + ticket.getTicketNumber();
            String html = wrap(freshUser, queue, "You missed your turn",
                    "Hi " + firstName(freshUser) + ",<br><br>Your ticket <strong>" + escape(ticket.getTicketNumber()) + "</strong> was marked as no-show. You can join the queue again whenever you're ready.",
                    null, "Rejoin the queue", baseUrl + "/student/queues");

            sendHtml(freshUser.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendTicketNoShow failed: {}", ex.getMessage());
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendQueueClosed(User user, Ticket ticket, Queue queue) {
        try {
            if (user == null || ticket == null) return;
            User freshUser = userRepository.findById(user.getId()).orElse(user);
            if (!wantsTicketEmails(freshUser)) return;

            String subject = "🔒 Queue closed — Ticket " + ticket.getTicketNumber();
            String html = wrap(freshUser, queue, "The queue has closed",
                    "Hi " + firstName(freshUser) + ",<br><br><strong>" + escape(queue.getName()) + "</strong> closed for the day, so your waiting ticket was cancelled.",
                    null, "Browse services", baseUrl + "/student/queues");

            sendHtml(freshUser.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendQueueClosed failed: {}", ex.getMessage());
        }
    }

    // 🔧 FIX: This is the one that was failing in your logs
    @Async
    @Transactional(readOnly = true)
    public void sendVerificationCode(User user, String code) {
        try {
            if (user == null) return;
            User freshUser = userRepository.findById(user.getId()).orElse(user);

            String subject = "Your UniQueue verification code";
            String html = wrap(freshUser, null, "Verify your email",
                    "Hi " + firstName(freshUser) + ",<br><br>Enter this 6-digit code to activate your UniQueue account. It expires in 24 hours.",
                    codeBlock(code), null, null);

            sendHtml(freshUser.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendVerificationCode failed: {}", ex.getMessage());
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendPasswordReset(User user, String token) {
        try {
            if (user == null) return;
            User freshUser = userRepository.findById(user.getId()).orElse(user);

            String resetUrl = baseUrl + "/reset-password?token=" + token;
            String subject = "Reset your UniQueue password";
            String html = wrap(freshUser, null, "Reset your password",
                    "Hi " + firstName(freshUser) + ",<br><br>Click the button below to choose a new password. This link expires in 30 minutes.",
                    null, "Reset password", resetUrl);

            sendHtml(freshUser.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendPasswordReset failed: {}", ex.getMessage());
        }
    }

    @Async
    @Transactional(readOnly = true)
    public void sendBottleneckAlert(User admin, WorkflowAnalyticsResponse analytics, WorkflowAnalyticsResponse.StepAnalytics step) {
        try {
            if (admin == null || analytics == null || step == null) return;
            User freshAdmin = userRepository.findById(admin.getId()).orElse(admin);

            String workflowName = analytics.getWorkflowName() != null ? analytics.getWorkflowName() : "Workflow";
            String subject = "⚠️ Bottleneck alert — " + workflowName;
            String stepLabel = step.getLabel() != null && !step.getLabel().isBlank() ? step.getLabel() : (step.getQueueName() != null ? step.getQueueName() : "Step " + step.getOrder());

            String body = "Hi " + firstName(freshAdmin) + ",<br><br>We detected a bottleneck in <strong>" + escape(workflowName) + "</strong>.";
            String table = bottleneckTable(analytics, step, stepLabel);
            String analyticsUrl = baseUrl + "/admin/workflows/" + analytics.getWorkflowId() + "/analytics";

            String html = wrap(freshAdmin, null, "Bottleneck detected", body, table, "View analytics", analyticsUrl);
            sendHtml(freshAdmin.getEmail(), subject, html);
        } catch (Exception ex) {
            log.error("sendBottleneckAlert failed: {}", ex.getMessage());
        }
    }

    // ============================================================
    //  HTML builders — unchanged
    // ============================================================
    private String wrap(User user, Queue queue, String heading, String body, String callout, String ctaLabel, String ctaUrl) {
        String uniName = user != null && user.getUniversity() != null && user.getUniversity().getName() != null ? user.getUniversity().getName() : "UniQueue";
        String accent = user != null && user.getUniversity() != null && user.getUniversity().getPrimaryColor() != null ? user.getUniversity().getPrimaryColor() : "#4f46e5";

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
                .append(escape(uniName)).append(".")
                .append("</td></tr></table></td></tr></table></body></html>");

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

    private String bottleneckTable(WorkflowAnalyticsResponse analytics, WorkflowAnalyticsResponse.StepAnalytics step, String stepLabel) {
        String sessionSuffix = analytics.getSession() != null ? " (" + escape(analytics.getSession()) + ")" : "";
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
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 10px 0;\"><tr>" +
                "<td style=\"width:45%;padding:2px 0;font-size:12px;color:#64748b;vertical-align:top;\">" + escape(label) + "</td>" +
                "<td style=\"padding:2px 0;font-size:13px;font-weight:600;color:#0f172a;vertical-align:top;\">" + value + "</td>" +
                "</tr></table>";
    }

    private String rowHighlighted(String label, String value) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 10px 0;\"><tr>" +
                "<td style=\"width:45%;padding:2px 0;font-size:12px;color:#64748b;vertical-align:top;\">" + escape(label) + "</td>" +
                "<td style=\"padding:2px 0;font-size:15px;font-weight:700;color:#dc2626;vertical-align:top;\">" + value + "</td>" +
                "</tr></table>";
    }

    private String formatHours(double hours) {
        if (hours < 48) return String.format("%.1f hours", hours);
        return String.format("%.1f days", hours / 24.0);
    }

    private String firstName(User user) {
        if (user.getFullName() == null) return "there";
        String[] parts = user.getFullName().trim().split("\\s+");
        return parts.length > 0 ? parts[0] : "there";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }
}