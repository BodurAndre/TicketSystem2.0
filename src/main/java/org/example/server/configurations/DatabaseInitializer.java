package org.example.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.example.server.models.Company;
import org.example.server.models.PhoneNumber;
import org.example.server.models.Request;
import org.example.server.models.Server;
import org.example.server.models.User;
import org.example.server.DTO.UserCreateDTO;
import org.example.server.service.CompanyService;
import org.example.server.service.PhoneNumberService;
import org.example.server.service.RequestService;
import org.example.server.service.ServerService;
import org.example.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final CompanyService companyService;
    private final ServerService serverService;
    private final PhoneNumberService phoneNumberService;
    private final UserService userService;
    private final RequestService requestService;

    @Autowired
    public DatabaseInitializer(CompanyService companyService, ServerService serverService, 
                             PhoneNumberService phoneNumberService, UserService userService,
                             RequestService requestService) {
        this.companyService = companyService;
        this.serverService = serverService;
        this.phoneNumberService = phoneNumberService;
        this.userService = userService;
        this.requestService = requestService;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting database initialization...");
        
        try {
            // Проверяем, есть ли уже данные
            List<Company> existingCompanies = companyService.getAllCompanies();
            log.info("Found {} existing companies", existingCompanies.size());
            
            if (!existingCompanies.isEmpty()) {
                log.info("Database already has data, skipping initialization");
                return;
            }

            log.info("No data found, initializing database...");
            /*
            // Создаем компании
            Company company1 = new Company();
            company1.setName("Pizza Lunch SRL");
            company1 = companyService.saveCompany(company1);
            log.info("Created company: {} with ID: {}", company1.getName(), company1.getId());

            Company company2 = new Company();
            company2.setName("Company SRL");
            company2 = companyService.saveCompany(company2);
            log.info("Created company: {} with ID: {}", company2.getName(), company2.getId());

            // Создаем серверы для каждой компании
            Server server1 = new Server();
            server1.setName("Pizza Lunch RMS1");
            server1.setCompany(company1);
            server1 = serverService.saveServer(server1);
            log.info("Created server: {} for company: {}", server1.getName(), company1.getName());

            Server server2 = new Server();
            server2.setName("Pizza Lunch RMS2");
            server2.setCompany(company1);
            server2 = serverService.saveServer(server2);
            log.info("Created server: {} for company: {}", server2.getName(), company1.getName());

            Server server3 = new Server();
            server3.setName("Pizza Lunch CHAIN");
            server3.setCompany(company1);
            server3 = serverService.saveServer(server3);
            log.info("Created server: {} for company: {}", server3.getName(), company1.getName());

            Server server4 = new Server();
            server4.setName("Company RMS");
            server4.setCompany(company2);
            server4 = serverService.saveServer(server4);
            log.info("Created server: {} for company: {}", server4.getName(), company2.getName());

            // Создаем номера телефонов для каждой компании
            PhoneNumber phone1 = new PhoneNumber();
            phone1.setNumber("+373 22 123456");
            phone1.setCompany(company1);
            phone1 = phoneNumberService.savePhoneNumber(phone1);
            log.info("Created phone number: {} for company: {}", phone1.getNumber(), company1.getName());

            PhoneNumber phone2 = new PhoneNumber();
            phone2.setNumber("+373 22 654321");
            phone2.setCompany(company1);
            phone2 = phoneNumberService.savePhoneNumber(phone2);
            log.info("Created phone number: {} for company: {}", phone2.getNumber(), company1.getName());

            PhoneNumber phone3 = new PhoneNumber();
            phone3.setNumber("+373 22 789012");
            phone3.setCompany(company2);
            phone3 = phoneNumberService.savePhoneNumber(phone3);
            log.info("Created phone number: {} for company: {}", phone3.getNumber(), company2.getName());
            */
            // Если нет пользователей — создаём админа
            User admin = null;
            if (userService.countUsers() == 0) {
                UserCreateDTO adminDTO = new UserCreateDTO();
                adminDTO.setEmail("admin@git.com");
                adminDTO.setFirstName("Admin");
                adminDTO.setLastName("Andrei");
                adminDTO.setRole("ADMIN");
                adminDTO.setCountry("MD");
                adminDTO.setLastSeen("Never");
                adminDTO.setDateOfBirth("2000-05-04");
                adminDTO.setGender("MALE");
                userService.createUser(adminDTO, "12345");
                admin = userService.getUserByEmail("admin@git.com\"");
                log.info("Создан админ: admin@git.com");
            } else {
                admin = userService.getUserByEmail("admin@git.com\"");
            }

            log.info("Database initialization completed successfully");
            
        } catch (Exception e) {
            log.error("Error during database initialization: " + e.getMessage(), e);
        }
    }
} 