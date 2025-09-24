package org.example.server.service;

import org.example.server.DTO.ChatMessageCreateDTO;
import org.example.server.DTO.ChatMessageDTO;
import org.example.server.models.ChatMessage;
import org.example.server.models.User;
import org.example.server.repositories.ChatMessageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserService userService;

    public ChatService(ChatMessageRepository chatMessageRepository, UserService userService) {
        this.chatMessageRepository = chatMessageRepository;
        this.userService = userService;
    }

    public ChatMessageDTO sendMessage(ChatMessageCreateDTO messageCreateDTO, Long senderId) {
        User sender = userService.getUserById(senderId);
        User receiver = userService.getUserById(messageCreateDTO.getRecipientId()); // Исправлено с getReceiverId()

        if (sender == null) {
            throw new IllegalArgumentException("Отправитель не найден");
        }
        if (receiver == null) {
            throw new IllegalArgumentException("Получатель не найден");
        }

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setMessage(messageCreateDTO.getText()); // Исправлено с getMessage()
        chatMessage.setSender(sender);
        chatMessage.setReceiver(receiver);

        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
        return mapToDTO(savedMessage);
    }

    public List<ChatMessageDTO> getConversation(Long userId1, Long userId2) {
        List<ChatMessage> messages = chatMessageRepository.findConversationBetweenUsers(userId1, userId2);
        return messages.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ChatMessageDTO> getUnreadMessages(Long userId) {
        List<ChatMessage> messages = chatMessageRepository.findUnreadMessagesForUser(userId);
        return messages.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<User> getConversationPartners(Long userId) {
        List<Object[]> results = chatMessageRepository.findConversationPartners(userId);
        List<User> partners = new ArrayList<>();
        
        for (Object[] result : results) {
            if (result[0] instanceof User) {
                User partner = (User) result[0];
                if (!partners.contains(partner)) {
                    partners.add(partner);
                }
            }
        }
        
        return partners;
    }

    public void markAsRead(Long messageId, Long userId) {
        ChatMessage message = chatMessageRepository.findById(messageId).orElse(null);
        if (message != null && message.getReceiver().getId().equals(userId)) {
            message.setIsRead(true);
            message.setReadAt(LocalDateTime.now());
            chatMessageRepository.save(message);
        }
    }

    public void markConversationAsRead(Long userId, Long partnerId) {
        List<ChatMessage> unreadMessages = chatMessageRepository.findUnreadMessagesForUser(userId);
        for (ChatMessage message : unreadMessages) {
            if (message.getSender().getId().equals(partnerId)) {
                message.setIsRead(true);
                message.setReadAt(LocalDateTime.now());
            }
        }
        chatMessageRepository.saveAll(unreadMessages);
    }

    private ChatMessageDTO mapToDTO(ChatMessage message) {
        return new ChatMessageDTO(
                message.getId(),
                message.getMessage(),
                message.getSender().getId(),
                message.getSender().getFirstName() + " " + message.getSender().getLastName(),
                message.getSender().getEmail(),
                message.getReceiver().getId(),
                message.getReceiver().getFirstName() + " " + message.getReceiver().getLastName(),
                message.getReceiver().getEmail(),
                message.getCreatedAt(),
                message.getIsRead(),
                message.getReadAt()
        );
    }
}
