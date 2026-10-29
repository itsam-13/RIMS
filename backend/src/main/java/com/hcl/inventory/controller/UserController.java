package com.hcl.inventory.controller;

import com.hcl.inventory.model.User;
import com.hcl.inventory.dto.RoleAssignmentRequest;
import com.hcl.inventory.dto.ApprovalUpdateRequest;
import com.hcl.inventory.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<User> assignRole(@PathVariable Long id, @Valid @RequestBody RoleAssignmentRequest request) {
        return ResponseEntity.ok(userService.assignRole(id, request.role()));
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<User> setApproval(@PathVariable Long id, @Valid @RequestBody ApprovalUpdateRequest request) {
        return ResponseEntity.ok(userService.setApproval(id, request.approved()));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(user));
    }

    // Public registration always creates an unapproved SALES account.
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@Valid @RequestBody User user) {
        User saved = userService.registerUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
