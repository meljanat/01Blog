package com.blog.api.repository;

import com.blog.api.model.Notification;
import com.blog.api.model.NotificationType;
import com.blog.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    long countByRecipientAndIsReadFalse(User recipient);

    List<Notification> findByRecipientAndActorAndTypeAndTargetIdOrderByCreatedAtDesc(
            User recipient, User actor, NotificationType type, Long targetId);

    void deleteByRecipientOrActor(User recipient, User actor);

    void deleteByRecipientAndActorAndTypeAndTargetId(
            User recipient, User actor, NotificationType type, Long targetId);

    void deleteByTypeInAndTargetId(Collection<NotificationType> types, Long targetId);
}
