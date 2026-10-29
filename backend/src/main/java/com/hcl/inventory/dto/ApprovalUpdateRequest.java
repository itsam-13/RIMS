package com.hcl.inventory.dto;

import jakarta.validation.constraints.NotNull;

public record ApprovalUpdateRequest(@NotNull Boolean approved) {}
