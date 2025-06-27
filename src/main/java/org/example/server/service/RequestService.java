package org.example.server.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.example.server.DTO.RequestUpdateDTO;
import org.example.server.models.Request;
import org.example.server.models.User;
import org.example.server.repositories.RequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class RequestService {
    private final RequestRepository requestRepository;

    @Autowired
    public RequestService(RequestRepository requestRepository) {
        this.requestRepository = requestRepository;
    }

    /*NEW VERSION*/

    public List<Request> getAllRequests() {
        List<Request> requests = requestRepository.findAll();
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }

    public List<Request> getRequestsByCreatorEmail(String email) {
        List<Request> requests = requestRepository.findByCreateUser_Email(email);
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }
    public List<Request> getRequestsByAssigneeEmail(String email) {
        List<Request> requests = requestRepository.findByAssigneeUser_Email(email);
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }

    /*NEW VERSION*/

    public List<Request> getAllRequestsWithStatusOpen() {
        List<Request> requests = requestRepository.findByStatus("OPEN");
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }

    public List<Request> getAllRequestsWithStatusClose() {
        List<Request> requests = requestRepository.findByStatus("CLOSED");
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }

    public Request setRequest(Request request) {
        return requestRepository.save(request);
    }

    public Request getRequest(long id) {
        // Используйте Optional для безопасного получения данных
        return requestRepository.findById(id)
                .orElse(new Request()); // Возвращает пустой объект Request, если не найдено
    }

    public void closeRequest(long id) {
        // Находим заявку по ID
        Optional<Request> optionalRequest = requestRepository.findById(id);

        if (optionalRequest.isPresent()) {
            // Если заявка найдена, обновляем статус
            Request request = optionalRequest.get();
            request.setStatus("CLOSED");
            requestRepository.save(request);  // Сохраняем обновленный объект
        } else {
            throw new EntityNotFoundException("Request not found with id " + id);
        }
    }

    public void reopenRequest(long id) {
        // Находим заявку по ID
        Optional<Request> optionalRequest = requestRepository.findById(id);

        if (optionalRequest.isPresent()) {
            // Если заявка найдена, обновляем статус
            Request request = optionalRequest.get();
            request.setStatus("OPEN");
            requestRepository.save(request);  // Сохраняем обновленный объект
        } else {
            throw new EntityNotFoundException("Request not found with id " + id);
        }
    }

    public List<Request> getOpenRequestsByCreatorEmail(String email) {
        List<Request> requests = requestRepository.findByStatusAndCreateUser_Email("OPEN", email);
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }
    public List<Request> getOpenRequestsByAssigneeEmail(String email) {
        List<Request> requests = requestRepository.findByStatusAndAssigneeUser_Email("OPEN", email);
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }

    public List<Request> getCloseRequestsByAssigneeEmail(String email) {
        List<Request> requests = requestRepository.findByStatusAndAssigneeUser_Email("CLOSED", email);
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }

    public List<Request> getCloseRequestsByCreatorEmail(String email) {
        List<Request> requests =  requestRepository.findByStatusAndCreateUser_Email("CLOSED", email);
        return requests.isEmpty() ? new ArrayList<>() : requests;
    }
}
