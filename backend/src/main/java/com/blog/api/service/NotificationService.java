package com.blog.api.service;

import com.blog.api.model.*;
import com.blog.api.repository.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void sendNotification(User recipient, User actor, NotificationType type, Long targetId, String message) {
        if (recipient.getId().equals(actor.getId())) {
            return;
        }

        List<Notification> existingNotifications = notificationRepository
                .findByRecipientAndActorAndTypeAndTargetIdOrderByCreatedAtDesc(recipient, actor, type, targetId);

        if (!existingNotifications.isEmpty()) {
            if (existingNotifications.size() > 1) {
                notificationRepository.deleteAll(existingNotifications.subList(1, existingNotifications.size()));
            }
            return;
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setType(type);
        notification.setTargetId(targetId);
        notification.setMessage(message);

        notificationRepository.save(notification);
    }

    @Transactional
    public void deleteNotification(User recipient, User actor, NotificationType type, Long targetId) {
        notificationRepository.deleteByRecipientAndActorAndTypeAndTargetId(recipient, actor, type, targetId);
    }
}
