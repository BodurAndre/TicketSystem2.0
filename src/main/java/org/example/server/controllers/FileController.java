package org.example.server.controllers;

import org.example.server.models.CommentFile;
import org.example.server.service.CommentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
public class FileController {

    private final CommentService commentService;

    public FileController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/files/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        try {
            CommentFile commentFile = commentService.getCommentFile(fileId);
            if (commentFile == null) {
                return ResponseEntity.notFound().build();
            }

            Path filePath = Paths.get(commentFile.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = commentFile.getContentType();
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, 
                                "attachment; filename=\"" + commentFile.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/api/files/{fileId}/view")
    public ResponseEntity<Resource> viewFile(@PathVariable Long fileId) {
        try {
            CommentFile commentFile = commentService.getCommentFile(fileId);
            if (commentFile == null) {
                return ResponseEntity.notFound().build();
            }

            Path filePath = Paths.get(commentFile.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = commentFile.getContentType();
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
