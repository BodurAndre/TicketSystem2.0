package org.example.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.server.DTO.CommentCreateDTO;
import org.example.server.DTO.CommentDTO;
import org.example.server.DTO.CommentFileDTO;
import org.example.server.models.Comment;
import org.example.server.models.CommentFile;
import org.example.server.models.Request;
import org.example.server.models.User;
import org.example.server.repositories.CommentFileRepository;
import org.example.server.repositories.CommentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommentService {
    
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    
    private final CommentRepository commentRepository;
    private final CommentFileRepository commentFileRepository;
    private final RequestService requestService;
    private final UserService userService;
    
    public CommentService(CommentRepository commentRepository, 
                         CommentFileRepository commentFileRepository,
                         RequestService requestService, 
                         UserService userService) {
        this.commentRepository = commentRepository;
        this.commentFileRepository = commentFileRepository;
        this.requestService = requestService;
        this.userService = userService;
    }
    
    public CommentDTO createComment(CommentCreateDTO commentCreateDTO, String userEmail) {
        return createCommentWithFiles(commentCreateDTO, userEmail, null);
    }

    public CommentDTO createCommentWithFiles(CommentCreateDTO commentCreateDTO, String userEmail, MultipartFile[] files) {
        Request request = requestService.getRequest(commentCreateDTO.getRequestId());
        if (request == null) {
            throw new IllegalArgumentException("������ �� �������");
        }
        
        User user = userService.getUserByEmail(userEmail);
        if (user == null) {
            throw new IllegalArgumentException("������������ �� ������");
        }
        
        Comment comment = new Comment();
        comment.setText(commentCreateDTO.getText());
        comment.setRequest(request);
        comment.setUser(user);
        comment.setIsSystem(commentCreateDTO.getIsSystem() != null ? commentCreateDTO.getIsSystem() : false);
        
        // ��������� ������ ��������� ��� JSON ������
        if (commentCreateDTO.getChangeDetails() != null && !commentCreateDTO.getChangeDetails().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                comment.setChangeDetails(mapper.writeValueAsString(commentCreateDTO.getChangeDetails()));
            } catch (Exception e) {
                comment.setChangeDetails(String.join("; ", commentCreateDTO.getChangeDetails()));
            }
        }
        
        Comment savedComment = commentRepository.save(comment);
        
        // ��������� �����, ���� ��� ����
        List<CommentFile> commentFiles = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        CommentFile commentFile = saveFile(file, savedComment);
                        commentFiles.add(commentFile);
                    } catch (IOException e) {
                        throw new RuntimeException("������ ��� ���������� �����: " + file.getOriginalFilename(), e);
                    }
                }
            }
        }
        
        return mapToDTO(savedComment, commentFiles);
    }

    private CommentFile saveFile(MultipartFile file, Comment comment) throws IOException {
        // ������� ����� uploads, ���� � ���
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // ���������� ���������� ��� �����
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.lastIndexOf(".") > 0) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + fileExtension;
        
        // ��������� ����
        Long requestId = comment.getRequest().getId();
        Path requestPath = uploadPath.resolve("request_" + requestId);
        if (!Files.exists(requestPath)) {
            Files.createDirectories(requestPath);
        }
        
        Path targetLocation = requestPath.resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        // ���������� ��� �����
        CommentFile.FileType fileType = determineFileType(file.getContentType());

        // ������� ������ � ���� ������
        CommentFile commentFile = new CommentFile();
        commentFile.setFileName(originalFileName);
        commentFile.setFilePath(targetLocation.toString());
        commentFile.setFileSize(file.getSize());
        commentFile.setContentType(file.getContentType());
        commentFile.setFileType(fileType);
        commentFile.setComment(comment);

        return commentFileRepository.save(commentFile);
    }

    private CommentFile.FileType determineFileType(String contentType) {
        if (contentType == null) {
            return CommentFile.FileType.DOCUMENT;
        }
        
        if (contentType.startsWith("image/")) {
            return CommentFile.FileType.IMAGE;
        } else if (contentType.startsWith("video/")) {
            return CommentFile.FileType.VIDEO;
        } else {
            return CommentFile.FileType.DOCUMENT;
        }
    }
    
    public List<CommentDTO> getCommentsByRequestId(Long requestId) {
        List<Comment> comments = commentRepository.findByRequestIdOrderByCreatedAtAsc(requestId);
        return comments.stream()
                .map(comment -> {
                    List<CommentFile> files = commentFileRepository.findByCommentId(comment.getId());
                    return mapToDTO(comment, files);
                })
                .collect(Collectors.toList());
    }

    public CommentFile getCommentFile(Long fileId) {
        return commentFileRepository.findById(fileId).orElse(null);
    }
    
    private CommentDTO mapToDTO(Comment comment) {
        List<CommentFile> files = commentFileRepository.findByCommentId(comment.getId());
        return mapToDTO(comment, files);
    }

    private CommentDTO mapToDTO(Comment comment, List<CommentFile> files) {
        List<String> changeDetails = null;
        if (comment.getChangeDetails() != null && !comment.getChangeDetails().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                changeDetails = mapper.readValue(comment.getChangeDetails(), List.class);
            } catch (Exception e) {
                changeDetails = Arrays.asList(comment.getChangeDetails().split("; "));
            }
        }

        List<CommentFileDTO> fileDTOs = files.stream()
                .map(this::mapFileToDTO)
                .collect(Collectors.toList());
        
        return new CommentDTO(
                comment.getId(),
                comment.getText(),
                comment.getRequest().getId(),
                comment.getUser().getId(),
                comment.getUser().getFirstName() + " " + comment.getUser().getLastName(),
                comment.getUser().getEmail(),
                comment.getCreatedAt(),
                comment.getIsSystem(),
                changeDetails,
                fileDTOs
        );
    }

    private CommentFileDTO mapFileToDTO(CommentFile file) {
        return new CommentFileDTO(
                file.getId(),
                file.getFileName(),
                file.getFilePath(),
                file.getFileSize(),
                file.getContentType(),
                file.getFileType(),
                file.getUploadedAt()
        );
    }
}
