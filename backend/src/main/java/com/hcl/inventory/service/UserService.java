package com.hcl.inventory.service;

import com.hcl.inventory.model.User;
import com.hcl.inventory.model.Role;
import com.hcl.inventory.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found with username: " + username));
    }

    // Public sign-up starts with SALES access, pending superadmin approval.
    public User registerUser(User user) {
        validateUnique(user);
        user.setRole(Role.SALES);
        user.setApproved(false);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User createUser(User user) {
        validateUnique(user);
        if (user.getRole() == null || user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.PENDING) {
            throw new IllegalArgumentException("Choose an operational role for the new account");
        }
        user.setApproved(true);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    private void validateUnique(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username '" + user.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("An account with email '" + user.getEmail() + "' already exists");
        }

    }

    public User assignRole(Long id, Role role) {
        if (role == Role.SUPER_ADMIN || role == Role.PENDING) {
            throw new IllegalArgumentException("Choose an operational role; approval is managed separately");
        }
        User existing = getUserById(id);
        if (existing.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("The superadmin account cannot be changed here");
        }
        existing.setRole(role);
        return userRepository.save(existing);
    }

    public User setApproval(Long id, boolean approved) {
        User existing = getUserById(id);
        if (!approved && existing.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("The superadmin account cannot be disabled");
        }
        existing.setApproved(approved);
        return userRepository.save(existing);
    }

    // Updates profile fields. Password is only changed if a new one is
    // provided — an empty/null password in the request leaves it unchanged.
    public User updateUser(Long id, User updatedUser) {
        User existing = getUserById(id);
        if (existing.getRole() == Role.SUPER_ADMIN
                || updatedUser.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("The superadmin account cannot be changed here");
        }

        if (!existing.getUsername().equals(updatedUser.getUsername())
                && userRepository.existsByUsername(updatedUser.getUsername())) {
            throw new IllegalArgumentException("Username '" + updatedUser.getUsername() + "' is already taken");
        }
        if (!existing.getEmail().equals(updatedUser.getEmail())
                && userRepository.existsByEmail(updatedUser.getEmail())) {
            throw new IllegalArgumentException("An account with email '" + updatedUser.getEmail() + "' already exists");
        }

        existing.setUsername(updatedUser.getUsername());
        existing.setEmail(updatedUser.getEmail());
        if (updatedUser.getRole() != null) {
            existing.setRole(updatedUser.getRole());
        }

        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }

        return userRepository.save(existing);
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("The superadmin account cannot be deleted here");
        }
        userRepository.deleteById(id);
    }

    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }
}
