package org.example.server.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.server.models.CommentFile;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentFileDTO {
    private Long id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private CommentFile.FileType fileType;
    private LocalDateTime uploadedAt;
}
