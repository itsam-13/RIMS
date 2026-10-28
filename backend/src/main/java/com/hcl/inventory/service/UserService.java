package com.hcl.inventory.service;

import com.hcl.inventory.model.User;
import com.hcl.inventory.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // Registers a new user, hashing the plaintext password before it ever
    // touches the database.
    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username '" + user.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("An account with email '" + user.getEmail() + "' already exists");
        }

        // Enforce role security: public self-registration assigns SALES (or ADMIN if system has 0 users).
        // Only an authenticated ADMIN can provision specific roles (WAREHOUSE_MANAGER, ADMIN).
        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            if (userRepository.count() == 0) {
                user.setRole(User.Role.ADMIN);
            } else {
                user.setRole(User.Role.SALES);
            }
        } else if (user.getRole() == null) {
            user.setRole(User.Role.SALES);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Updates profile fields. Password is only changed if a new one is
    // provided — an empty/null password in the request leaves it unchanged.
    public User updateUser(Long id, User updatedUser) {
        User existing = getUserById(id);

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
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }
}
