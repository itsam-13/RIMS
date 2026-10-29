package com.hcl.inventory.config;

import com.hcl.inventory.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split("\\s*,\\s*")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // Public endpoints: auth & registration
                        .requestMatchers("/api/auth/**", "/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/register").permitAll()

                        // User administration is reserved for the superadmin.
                        .requestMatchers("/api/users/**").hasRole("SUPER_ADMIN")

                        // Admin and superadmin can perform destructive operations.
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // Inbound procurement & inventory modifications (Admin and Warehouse Manager only)
                        .requestMatchers("/api/purchase-orders/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/inventory/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/inventory/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/api/stock-movements/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")

                        // Master data management: Products, Categories, Warehouses, Suppliers (Admin and Warehouse Manager only)
                        .requestMatchers(HttpMethod.POST, "/api/products/**", "/api/categories/**", "/api/warehouses/**", "/api/suppliers/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/products/**", "/api/categories/**", "/api/warehouses/**", "/api/suppliers/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/products/**", "/api/categories/**", "/api/warehouses/**", "/api/suppliers/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "WAREHOUSE_MANAGER")

                        // Outbound customer sales orders creation and progression (Admin and Sales only)
                        .requestMatchers(HttpMethod.POST, "/api/orders/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "SALES")
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "SALES")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "SALES")

                        // All remaining read operations (GET inventory, products, warehouses, orders, etc.) require authentication
                        .requestMatchers("/api/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "SALES")
                        .anyRequest().authenticated()
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(401);
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            res.getWriter().write("{\"error\":\"Unauthorized: missing or invalid token\"}");
                        })
                        .accessDeniedHandler((req, res, e) -> {
                            res.setStatus(403);
                            res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            res.getWriter().write("{\"error\":\"Forbidden: insufficient role\"}");
                        })
                )

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
