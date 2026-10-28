package com.hcl.inventory.controller;

import com.hcl.inventory.dto.LoginRequest;
import com.hcl.inventory.dto.LoginResponse;
import com.hcl.inventory.model.User;
import com.hcl.inventory.security.JwtUtil;
import com.hcl.inventory.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "No account found with username '" + request.getUsername() + "'. Please sign up first.",
                    "userNotFound", true
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Unable to sign in. Please verify your details.",
                    "userNotFound", false
            ));
        }

        if (!userService.checkPassword(user, request.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Invalid password. Please check your credentials and try again.",
                    "userNotFound", false
            ));
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), user.getRole().name()));
    }
}
