package org.example.server.repositories;

import org.example.server.models.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<Request,Long> {

    Optional<Request> findById(Long id);
    List<Request> findByStatus(String status);
    List<Request> findByStatusAndCreateUser_Email(String status, String email);
    List<Request> findByStatusAndAssigneeUser_Email(String status, String email);
}
