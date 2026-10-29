package com.hcl.inventory;

import com.hcl.inventory.config.SecurityConfig;
import com.hcl.inventory.model.Role;
import com.hcl.inventory.model.User;
import com.hcl.inventory.repository.UserRepository;
import com.hcl.inventory.security.JwtAuthFilter;
import com.hcl.inventory.security.JwtUtil;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtSecurityTests {

    private final JwtUtil jwtUtil = new JwtUtil();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtUtil, "secret", "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 86_400_000L);
        SecurityContextHolder.clearContext();
    }

    @Test
    void signedTokenValidatesAndTamperingFails() {
        String token = jwtUtil.generateToken(7L, "operator", "SALES");
        assertTrue(jwtUtil.isTokenValid(token));
        assertEquals("operator", jwtUtil.extractUsername(token));
        assertEquals(7L, jwtUtil.extractUserId(token));
        String[] parts = token.split("\\.");
        parts[2] = (parts[2].charAt(0) == 'A' ? "B" : "A") + parts[2].substring(1);
        assertFalse(jwtUtil.isTokenValid(String.join(".", parts)));
    }

    @Test
    void filterSetsRoleOnlyForAValidBearerToken() throws Exception {
        UserRepository users = mock(UserRepository.class);
        when(users.findById(7L)).thenReturn(Optional.of(
                new User(7L, "operator", "operator@example.com", "hash", Role.SALES)));
        JwtAuthFilter filter = new JwtAuthFilter(jwtUtil, users);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwtUtil.generateToken(7L, "operator", "SALES"));
        AtomicBoolean continued = new AtomicBoolean();
        FilterChain chain = (req, res) -> continued.set(true);

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        assertTrue(continued.get());
        assertEquals("operator", SecurityContextHolder.getContext().getAuthentication().getName());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_SALES")));
        SecurityContextHolder.clearContext();
    }

    @Test
    void filterUsesTheDatabaseRoleAndMarksUnapprovedAccounts() throws Exception {
        UserRepository users = mock(UserRepository.class);
        User user = new User(7L, "operator", "operator@example.com", "hash", Role.SALES);
        user.setApproved(false);
        when(users.findById(7L)).thenReturn(Optional.of(user));
        JwtAuthFilter filter = new JwtAuthFilter(jwtUtil, users);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwtUtil.generateToken(7L, "operator", "ADMIN"));

        filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> {});

        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();
        assertTrue(authorities.stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_UNAPPROVED")));
        assertFalse(authorities.stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void corsAllowsOnlyTheConfiguredFrontendOrigin() {
        SecurityConfig config = new SecurityConfig(new JwtAuthFilter(jwtUtil, mock(UserRepository.class)));
        ReflectionTestUtils.setField(config, "allowedOrigins", "http://localhost:4200,http://localhost:4201");
        var cors = config.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest();

        request.addHeader("Origin", "http://localhost:4201");
        assertEquals("http://localhost:4201", cors.getCorsConfiguration(request).checkOrigin("http://localhost:4201"));
        assertTrue(cors.getCorsConfiguration(request).checkOrigin("https://attacker.example") == null);
    }
}
