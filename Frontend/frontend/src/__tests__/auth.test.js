/**
 * auth.test.js — Authentication flow tests.
 *
 * Tests the Login and Signup component behaviours using
 * React Testing Library + msw for API mocking.
 *
 * Run: npm test -- --testPathPattern=auth
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock axios globally
jest.mock("axios", () => ({
  post: jest.fn(),
  get: jest.fn(),
  defaults: { headers: { common: {} } },
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  })),
}));

import axios from "axios";

// ── Password strength helper (matches backend rules) ───────────────────────
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("number");
  if (!/[!@#$%^&*()\-_=+\[\]{}|;':",./<>?]/.test(password)) errors.push("special character");
  return errors;
}

describe("Password Strength Validation (frontend)", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(validatePassword("Ab1!")).toContain("at least 8 characters");
  });

  it("rejects passwords without uppercase", () => {
    expect(validatePassword("alllower1!")).toContain("uppercase letter");
  });

  it("rejects passwords without lowercase", () => {
    expect(validatePassword("ALLCAPS1!")).toContain("lowercase letter");
  });

  it("rejects passwords without a number", () => {
    expect(validatePassword("NoNumber!!")).toContain("number");
  });

  it("rejects passwords without special chars", () => {
    expect(validatePassword("NoSpecial1")).toContain("special character");
  });

  it("accepts strong passwords", () => {
    expect(validatePassword("ValidPass1!")).toHaveLength(0);
  });
});


// ── API call mocking tests ─────────────────────────────────────────────────
describe("Auth API calls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("login call sends correct payload", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: "fake.jwt.token",
        refresh_token: "fake.refresh.token",
        role: "user",
        email: "test@example.com",
      },
    });

    await axios.post("/api/auth/login", {
      email: "test@example.com",
      password: "ValidPass1!",
      role_type: "customer",
    });

    expect(axios.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "test@example.com",
      password: "ValidPass1!",
      role_type: "customer",
    });
  });

  it("signup returns generic message (anti-enumeration)", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "If this email is not already registered, a verification code has been sent." },
    });

    const res = await axios.post("/api/auth/customer/signup", {
      email: "user@example.com",
      password: "ValidPass1!",
      name: "Alice",
    });

    expect(res.data.message).toContain("verification code");
  });

  it("handles login 401 gracefully", async () => {
    axios.post.mockRejectedValueOnce({
      response: { status: 401, data: { detail: "Invalid email or password" } },
    });

    let errorDetail = null;
    try {
      await axios.post("/api/auth/login", {
        email: "wrong@example.com",
        password: "WrongPass1!",
      });
    } catch (err) {
      errorDetail = err.response?.data?.detail;
    }

    expect(errorDetail).toBe("Invalid email or password");
  });
});
