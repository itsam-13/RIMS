package com.hcl.inventory.controller;

import com.hcl.inventory.dto.LoginRequest;
import com.hcl.inventory.dto.LoginResponse;
import com.hcl.inventory.dto.AccountStatusResponse;
import com.hcl.inventory.model.User;
import com.hcl.inventory.model.Role;
import com.hcl.inventory.security.JwtUtil;
import com.hcl.inventory.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user;
        try {
            user = userService.getUserByUsername(request.getUsername());
        } catch (EntityNotFoundException e) {
            return invalidCredentials();
        }

        if (!userService.checkPassword(user, request.getPassword())) {
            return invalidCredentials();
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), user.getRole().name(),
                user.isApproved() && user.getRole() != Role.PENDING));
    }

    @GetMapping("/status")
    public ResponseEntity<?> accountStatus(Authentication authentication) {
        if (authentication == null || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(new AccountStatusResponse(user.getUsername(), user.getRole().name(),
                user.isApproved() && user.getRole() != Role.PENDING));
    }

    private ResponseEntity<Map<String, Object>> invalidCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Invalid username or password",
                "userNotFound", false
        ));
    }
}
