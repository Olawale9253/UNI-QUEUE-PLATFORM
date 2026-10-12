package com.uniqueeue.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class EventService {

    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<Long, List<ClientConnection>> byUser = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId, Long universityId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        ClientConnection connection = new ClientConnection(emitter, userId, universityId);

        byUser.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(connection);

        emitter.onCompletion(() -> remove(connection));
        emitter.onTimeout(() -> {
            log.debug("SSE timeout for user {}", userId);
            remove(connection);
            emitter.complete();
        });
        emitter.onError(ex -> {
            log.debug("SSE error for user {}: {}", userId, ex.getMessage());
            remove(connection);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("userId", userId)));
        } catch (IOException e) {
            log.debug("Could not send initial SSE event to user {}: {}", userId, e.getMessage());
            remove(connection);
        }

        log.debug("SSE connected — user {} (university {}) — total connections: {}",
                userId, universityId, totalConnections());
        return emitter;
    }

    private void remove(ClientConnection connection) {
        List<ClientConnection> list = byUser.get(connection.userId());
        if (list != null) {
            list.remove(connection);
            if (list.isEmpty()) byUser.remove(connection.userId());
        }
    }

    private int totalConnections() {
        return byUser.values().stream().mapToInt(List::size).sum();
    }

    // ============================================================
    //  Public broadcast — auto-defers to afterCommit when inside a tx
    // ============================================================

    public void broadcastToUser(Long userId, String topic, Object payload) {
        if (userId == null) return;
        runAfterCommit(() -> doBroadcastToUser(userId, topic, payload));
    }

    public void broadcastToUniversity(Long universityId, String topic, Object payload) {
        if (universityId == null) return;
        runAfterCommit(() -> doBroadcastToUniversity(universityId, topic, payload));
    }

    public void broadcastToAll(String topic, Object payload) {
        runAfterCommit(() -> doBroadcastToAll(topic, payload));
    }

    /**
     * Register the given action to fire AFTER the current transaction commits.
     * If there is no transaction, runs immediately.
     *
     * This is what makes queue counts update live: without it, the SSE event
     * would reach the client before the DB had committed the new ticket, so
     * the client's immediate refetch would return stale data.
     */
    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()
                && TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try { action.run(); } catch (Exception ex) {
                        log.warn("post-commit broadcast failed: {}", ex.getMessage());
                    }
                }
            });
        } else {
            action.run();
        }
    }

    // ============================================================
    //  Actual emitters
    // ============================================================

    private void doBroadcastToUser(Long userId, String topic, Object payload) {
        List<ClientConnection> list = byUser.get(userId);
        if (list == null || list.isEmpty()) return;
        Map<String, Object> message = Map.of(
                "topic", topic,
                "payload", payload == null ? Map.of() : payload);
        for (ClientConnection c : list) send(c, message);
    }

    private void doBroadcastToUniversity(Long universityId, String topic, Object payload) {
        Map<String, Object> message = Map.of(
                "topic", topic,
                "payload", payload == null ? Map.of() : payload);
        byUser.values().forEach(list -> list.stream()
                .filter(c -> universityId.equals(c.universityId()))
                .forEach(c -> send(c, message)));
    }

    private void doBroadcastToAll(String topic, Object payload) {
        Map<String, Object> message = Map.of(
                "topic", topic,
                "payload", payload == null ? Map.of() : payload);
        byUser.values().forEach(list -> list.forEach(c -> send(c, message)));
    }

    private void send(ClientConnection connection, Map<String, Object> message) {
        try {
            connection.emitter().send(SseEmitter.event().data(message));
        } catch (Exception ex) {
            remove(connection);
        }
    }

    private record ClientConnection(SseEmitter emitter, Long userId, Long universityId) {}
}