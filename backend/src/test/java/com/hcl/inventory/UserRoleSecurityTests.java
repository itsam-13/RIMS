package com.hcl.inventory;

import com.hcl.inventory.model.Role;
import com.hcl.inventory.model.User;
import com.hcl.inventory.repository.UserRepository;
import com.hcl.inventory.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserRoleSecurityTests {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtUtil jwtUtil;

    @BeforeEach
    void clearUsers() {
        users.deleteAll();
    }

    @Test
    void publicSignupGetsUnapprovedSalesRoleAndCannotReachWorkspaceApisUntilApproved() throws Exception {
        mvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"new-user","email":"new@example.com","password":"valid-password","role":"SUPER_ADMIN"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("SALES"))
                .andExpect(jsonPath("$.approved").value(false))
                .andExpect(jsonPath("$.password").doesNotExist());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"new-user","password":"valid-password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("SALES"))
                .andExpect(jsonPath("$.approved").value(false));

        User created = users.findByUsername("new-user").orElseThrow();
        mvc.perform(get("/api/auth/status").header("Authorization", bearer("SALES")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approved").value(false));
        mvc.perform(get("/api/products").header("Authorization", bearer("SALES")))
                .andExpect(status().isForbidden());

        mvc.perform(patch("/api/users/{id}/approval", created.getId())
                        .header("Authorization", bearer("SUPER_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"approved\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approved").value(true));

        mvc.perform(get("/api/products").header("Authorization", bearer("SALES")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/auth/status").header("Authorization", bearer("SALES")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approved").value(true));
    }

    @Test
    void onlySuperadminCanCreateApprovedOperatorAccounts() throws Exception {
        mvc.perform(post("/api/users")
                        .header("Authorization", bearer("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"managed","email":"managed@example.com","password":"valid-password","role":"SALES"}
                                """))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/users")
                        .header("Authorization", bearer("SUPER_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"managed","email":"managed@example.com","password":"valid-password","role":"SALES","approved":false}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("SALES"))
                .andExpect(jsonPath("$.approved").value(true))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void publicSignupTreatsExplicitNullRoleAsSales() throws Exception {
        mvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"roleless","email":"roleless@example.com","password":"valid-password","role":null}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("SALES"))
                .andExpect(jsonPath("$.approved").value(false));
    }

    @Test
    void onlySuperadminCanListUsersAndAssignNonRootRoles() throws Exception {
        User pending = users.save(new User(null, "operator", "operator@example.com",
                passwordEncoder.encode("valid-password"), Role.PENDING));
        pending.setApproved(false);
        users.save(pending);

        mvc.perform(get("/api/products").header("Authorization", bearer("PENDING")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", bearer("ADMIN")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", bearer("SUPER_ADMIN")))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/users/{id}/role", pending.getId())
                        .header("Authorization", bearer("SALES"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"SALES\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(patch("/api/users/{id}/role", pending.getId())
                        .header("Authorization", bearer("SUPER_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"WAREHOUSE_MANAGER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("WAREHOUSE_MANAGER"));

        mvc.perform(patch("/api/users/{id}/role", pending.getId())
                        .header("Authorization", bearer("SUPER_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"SUPER_ADMIN\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void superadminCannotBeDeleted() throws Exception {
        User root = users.save(new User(null, "root", "root@example.com",
                passwordEncoder.encode("valid-password"), Role.SUPER_ADMIN));

        mvc.perform(delete("/api/users/{id}", root.getId())
                        .header("Authorization", bearer("SUPER_ADMIN")))
                .andExpect(status().isBadRequest());
    }

    private String bearer(String role) {
        Role requestedRole = Role.valueOf(role);
        User user = users.findAll().stream()
                .filter(candidate -> candidate.getRole() == requestedRole)
                .findFirst()
                .orElseGet(() -> users.save(new User(null, "test-" + role,
                        "test-" + role.toLowerCase() + "@example.com",
                        passwordEncoder.encode("test-only-password"), requestedRole)));
        return "Bearer " + jwtUtil.generateToken(user.getId(), user.getUsername(), role);
    }
}
