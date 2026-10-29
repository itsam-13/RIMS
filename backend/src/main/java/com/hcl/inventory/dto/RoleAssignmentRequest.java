package com.hcl.inventory.dto;

import com.hcl.inventory.model.Role;
import jakarta.validation.constraints.NotNull;

public record RoleAssignmentRequest(@NotNull Role role) {}
