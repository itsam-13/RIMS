package com.hcl.inventory.config;

import com.hcl.inventory.model.Role;
import com.hcl.inventory.model.User;
import com.hcl.inventory.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@RequiredArgsConstructor
public class SuperAdminBootstrap {

    @Bean
    CommandLineRunner bootstrapSuperAdmin(
            UserRepository users,
            JdbcTemplate jdbc,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.super-admin.username:}") String username,
            @Value("${app.bootstrap.super-admin.email:}") String email,
            @Value("${app.bootstrap.super-admin.password:}") String password) {
        return args -> {
            jdbc.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            jdbc.execute("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN " +
                    "('PENDING', 'SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'SALES'))");
            jdbc.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT TRUE");
            jdbc.update("UPDATE users SET approved = FALSE WHERE role = 'PENDING' AND approved = TRUE");

            if (username.isBlank() && email.isBlank() && password.isBlank()) return;
            if (username.isBlank() || email.isBlank() || password.isBlank()) {
                throw new IllegalStateException("All superadmin bootstrap settings must be configured together");
            }
            if (users.existsByRole(Role.SUPER_ADMIN)) return;

            if (users.existsByUsername(username) || users.existsByEmail(email)) {
                throw new IllegalStateException("Superadmin bootstrap identity conflicts with an existing account");
            }

            users.save(new User(null, username, email, passwordEncoder.encode(password), Role.SUPER_ADMIN));
        };
    }
}
