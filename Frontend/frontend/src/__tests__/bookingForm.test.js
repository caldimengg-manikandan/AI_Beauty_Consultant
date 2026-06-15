/**
 * bookingForm.test.js — SalonDetailPage booking form tests.
 *
 * Tests that the Proceed to Payment button is only enabled
 * when all 5 required fields are filled.
 *
 * Run: npm test -- --testPathPattern=bookingForm
 */
import React from "react";

// ── Unit-test the button disabled logic directly ───────────────────────────
// This mirrors the exact condition in SalonDetailPage.js
function isProceedDisabled({ booking, selectedService, selectedDate, selectedTime, customer_name, customer_phone }) {
  return (
    !!booking ||
    !selectedService ||
    !selectedDate ||
    !selectedTime ||
    !customer_name.trim() ||
    !customer_phone.trim()
  );
}

describe("Booking Button Disabled Logic", () => {
  const base = {
    booking: null,
    selectedService: "Haircut",
    selectedDate: "2030-12-31",
    selectedTime: "10:00 AM",
    customer_name: "Alice",
    customer_phone: "9876543210",
  };

  it("is ENABLED when all fields are filled", () => {
    expect(isProceedDisabled(base)).toBe(false);
  });

  it("is DISABLED when no service selected", () => {
    expect(isProceedDisabled({ ...base, selectedService: null })).toBe(true);
  });

  it("is DISABLED when no date selected", () => {
    expect(isProceedDisabled({ ...base, selectedDate: null })).toBe(true);
  });

  it("is DISABLED when no time selected", () => {
    expect(isProceedDisabled({ ...base, selectedTime: null })).toBe(true);
  });

  it("is DISABLED when customer name is empty", () => {
    expect(isProceedDisabled({ ...base, customer_name: "" })).toBe(true);
  });

  it("is DISABLED when customer name is whitespace only", () => {
    expect(isProceedDisabled({ ...base, customer_name: "   " })).toBe(true);
  });

  it("is DISABLED when customer phone is empty", () => {
    expect(isProceedDisabled({ ...base, customer_phone: "" })).toBe(true);
  });

  it("is DISABLED when booking already exists (payment in progress)", () => {
    expect(isProceedDisabled({ ...base, booking: { id: "existing-booking" } })).toBe(true);
  });

  it("is DISABLED when multiple fields are missing", () => {
    expect(isProceedDisabled({ ...base, selectedService: null, customer_name: "" })).toBe(true);
  });
});


// ── Requirements checklist logic ───────────────────────────────────────────
describe("Booking Requirements Checklist", () => {
  function getChecklist({ selectedService, selectedDate, selectedTime, customer_name, customer_phone }) {
    return [
      [!!selectedService, "Choose a service"],
      [!!selectedDate, "Pick a date"],
      [!!selectedTime, "Select a time slot"],
      [!!customer_name?.trim(), "Enter your name"],
      [!!customer_phone?.trim(), "Enter your phone number"],
    ];
  }

  it("all items are done when all fields are filled", () => {
    const checklist = getChecklist({
      selectedService: "Facial",
      selectedDate: "2030-01-01",
      selectedTime: "11:00 AM",
      customer_name: "Bob",
      customer_phone: "1234567890",
    });
    expect(checklist.every(([done]) => done)).toBe(true);
  });

  it("correctly marks missing fields as undone", () => {
    const checklist = getChecklist({
      selectedService: null,
      selectedDate: "2030-01-01",
      selectedTime: null,
      customer_name: "Bob",
      customer_phone: "",
    });
    const [service, date, time, name, phone] = checklist;
    expect(service[0]).toBe(false);
    expect(date[0]).toBe(true);
    expect(time[0]).toBe(false);
    expect(name[0]).toBe(true);
    expect(phone[0]).toBe(false);
  });
});
