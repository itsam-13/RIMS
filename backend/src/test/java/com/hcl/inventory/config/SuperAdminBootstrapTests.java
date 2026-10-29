package com.hcl.inventory.config;

import com.hcl.inventory.model.Role;
import com.hcl.inventory.model.User;
import com.hcl.inventory.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SuperAdminBootstrapTests {

    @Test
    void createsSuperadminWithHashedPasswordOnlyWhenConfigured() throws Exception {
        UserRepository users = mock(UserRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var encoder = new BCryptPasswordEncoder();
        when(users.existsByRole(Role.SUPER_ADMIN)).thenReturn(false);
        when(users.existsByUsername("bootstrap-root")).thenReturn(false);
        when(users.existsByEmail("root@example.com")).thenReturn(false);
        when(users.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        new SuperAdminBootstrap().bootstrapSuperAdmin(
                users, jdbc, encoder, "bootstrap-root", "root@example.com", "test-only-pass").run();

        var saved = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals(Role.SUPER_ADMIN, saved.getValue().getRole());
        assertFalse(saved.getValue().getPassword().equals("test-only-pass"));
        assertTrue(encoder.matches("test-only-pass", saved.getValue().getPassword()));
    }
}
