package org.example.server.repositories;

import org.example.server.models.CommentFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentFileRepository extends JpaRepository<CommentFile, Long> {
    List<CommentFile> findByCommentId(Long commentId);
}
