package com.hcl.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hcl.inventory.model.User;
import com.hcl.inventory.model.Role;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserRegistrationValidationTests {

    @Test
    void registrationPayloadWithoutRoleUsesDefaultAndPassesValidation() throws Exception {
        User user = new ObjectMapper().readValue("""
                {"username":"superAdmin","email":"superAdmin@gmail.com","password":"valid-password"}
                """, User.class);

        assertEquals(Role.SALES, user.getRole());
        assertTrue(user.isApproved());
        try (var validatorFactory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(validatorFactory.getValidator().validate(user).isEmpty());
        }
    }
}
