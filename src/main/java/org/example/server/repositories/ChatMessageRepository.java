package org.example.server.repositories;

import org.example.server.models.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "(cm.sender.id = :userId1 AND cm.receiver.id = :userId2) OR " +
           "(cm.sender.id = :userId2 AND cm.receiver.id = :userId1) " +
           "ORDER BY cm.createdAt ASC")
    List<ChatMessage> findConversationBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.receiver.id = :userId AND cm.isRead = false")
    List<ChatMessage> findUnreadMessagesForUser(@Param("userId") Long userId);
    
    @Query("SELECT DISTINCT CASE " +
           "WHEN cm.sender.id = :userId THEN cm.receiver " +
           "WHEN cm.receiver.id = :userId THEN cm.sender " +
           "END FROM ChatMessage cm WHERE " +
           "cm.sender.id = :userId OR cm.receiver.id = :userId " +
           "ORDER BY cm.createdAt DESC")
    List<Object[]> findConversationPartners(@Param("userId") Long userId);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
           "(cm.sender.id = :userId AND cm.receiver.id = :partnerId) OR " +
           "(cm.sender.id = :partnerId AND cm.receiver.id = :userId) " +
           "ORDER BY cm.createdAt DESC")
    List<ChatMessage> findLatestMessagesBetweenUsers(@Param("userId") Long userId, @Param("partnerId") Long partnerId);
}
