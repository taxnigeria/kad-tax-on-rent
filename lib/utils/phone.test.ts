import { describe, it, expect } from "vitest"
import { normalizePhone, isValidPhone, formatPhoneForDisplay, formatAsYouType } from "./phone"

describe("Phone Utility", () => {
    describe("normalizePhone", () => {
        it("should normalize Nigerian numbers", () => {
            expect(normalizePhone("08031234567")).toBe("+2348031234567")
            expect(normalizePhone("+2348031234567")).toBe("+2348031234567")
            expect(normalizePhone("803 123 4567")).toBe("+2348031234567")
        })

        it("should handle international numbers with country code", () => {
            expect(normalizePhone("+447911123456", "GB")).toBe("+447911123456")
            expect(normalizePhone("07911123456", "GB")).toBe("+447911123456")
        })

        it("should return null for invalid numbers", () => {
            expect(normalizePhone("123")).toBe(null)
            expect(normalizePhone("abc")).toBe(null)
        })
    })

    describe("isValidPhone", () => {
        it("should validate correct numbers", () => {
            expect(isValidPhone("08031234567")).toBe(true)
            expect(isValidPhone("+2348031234567")).toBe(true)
        })

        it("should invalidate incorrect numbers", () => {
            expect(isValidPhone("123")).toBe(false)
            expect(isValidPhone("0803123456789012345")).toBe(false)
        })
    })

    describe("formatPhoneForDisplay", () => {
        it("should format for international display", () => {
            expect(formatPhoneForDisplay("+2348031234567")).toBe("+234 803 123 4567")
        })
    })

    describe("formatAsYouType", () => {
        it("should format while typing", () => {
            // 0803 123 4567 is the expected format for NG mobile
            expect(formatAsYouType("08031234567", "NG")).toBe("0803 123 4567")
        })
    })
})
