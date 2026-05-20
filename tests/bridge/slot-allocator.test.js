/**
 * Slot Allocator Tests
 * Constitution: Section VI — TDD
 * Spec: .specify/specs/01-bridge-server.md
 * 
 * SlotAllocator manages 30 slots (0-29) using O(1) Set-based allocation
 * with 5-second cooldown on free to prevent thrashing.
 * 
 * 🔴 RED phase: Module doesn't exist yet — all tests fail.
 * 🟢 GREEN phase: After implementation, all tests pass.
 */

const { SlotAllocator } = require('../../server-bridge/slot-allocator');

describe('SlotAllocator', () => {
  let allocator;

  beforeEach(() => {
    allocator = new SlotAllocator(30);
  });

  // -----------------------------------------------------------------------
  // Basic allocation
  // -----------------------------------------------------------------------
  test('assigns slot 0 when all 30 slots are free', () => {
    const slot = allocator.allocate();
    expect(slot).toBe(0);
  });

  test('assigns sequential slots 0, 1, 2 on repeated calls', () => {
    expect(allocator.allocate()).toBe(0);
    expect(allocator.allocate()).toBe(1);
    expect(allocator.allocate()).toBe(2);
  });

  test('reuses freed slot 0 on next assign after free', () => {
    allocator.allocate(); // slot 0
    allocator.allocate(); // slot 1
    allocator.free(0);
    expect(allocator.allocate()).toBe(0);
  });

  test('returns -1 when all 30 slots are occupied', () => {
    for (let i = 0; i < 30; i++) {
      allocator.allocate();
    }
    expect(allocator.allocate()).toBe(-1);
  });

  test('frees slot and makes it available again', () => {
    allocator.allocate(); // slot 0
    allocator.allocate(); // slot 1
    allocator.free(0);
    expect(allocator.isAllocated(0)).toBe(false);
    expect(allocator.isAllocated(1)).toBe(true);
  });

  test('does not free slot that is not assigned', () => {
    const result = allocator.free(5);
    expect(result).toBe(false);
  });

  test('returns false when freeing already-free slot twice', () => {
    allocator.allocate(); // slot 0
    expect(allocator.free(0)).toBe(true);
    expect(allocator.free(0)).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Cooldown management
  // -----------------------------------------------------------------------
  test('marks slot as cooling down on free (5s timer)', () => {
    allocator.allocate(); // slot 0
    allocator.startCooldown(0);
    expect(allocator.isOnCooldown(0)).toBe(true);
  });

  test('slot is unavailable during cooldown', () => {
    allocator.allocate(); // slot 0
    allocator.allocate(); // slot 1
    allocator.free(0);
    allocator.startCooldown(0);
    // During cooldown, allocate should skip slot 0 and give next available
    const nextSlot = allocator.allocate();
    expect(nextSlot).not.toBe(0); // Should not get slot 0 during cooldown
    expect(nextSlot).toBeGreaterThanOrEqual(0);
  });

  test('slot becomes available after cooldown expires', async () => {
    allocator.allocate(); // slot 0
    allocator.free(0);
    allocator.startCooldown(0);
    
    // Use a short cooldown for testing
    const shortAllocator = new SlotAllocator(30, 100); // 100ms cooldown
    shortAllocator.allocate(); // slot 0
    shortAllocator.free(0);
    shortAllocator.startCooldown(0);
    
    expect(shortAllocator.isOnCooldown(0)).toBe(true);
    
    // Wait for cooldown to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(shortAllocator.isOnCooldown(0)).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Slot tracking
  // -----------------------------------------------------------------------
  test('tracks count of active slots correctly', () => {
    expect(allocator.activeCount).toBe(0);
    allocator.allocate();
    expect(allocator.activeCount).toBe(1);
    allocator.allocate();
    expect(allocator.activeCount).toBe(2);
    allocator.free(0);
    expect(allocator.activeCount).toBe(1);
    allocator.free(1);
    expect(allocator.activeCount).toBe(0);
  });

  test('getAllocatedSlots returns correct list', () => {
    allocator.allocate(); // 0
    allocator.allocate(); // 1
    allocator.allocate(); // 2
    allocator.free(1);
    expect(allocator.getAllocatedSlots()).toEqual([0, 2]);
  });

  test('getAllocatedSlots returns empty array when no slots allocated', () => {
    expect(allocator.getAllocatedSlots()).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  test('handles allocate-free-allocate-free cycle correctly', () => {
    for (let cycle = 0; cycle < 10; cycle++) {
      const slot = allocator.allocate();
      expect(slot).toBe(0); // Always gets slot 0 since we free it
      allocator.free(slot);
    }
  });

  test('handles burst allocation of all 30 slots', () => {
    const slots = [];
    for (let i = 0; i < 30; i++) {
      const slot = allocator.allocate();
      slots.push(slot);
    }
    // Verify all slots 0-29 are assigned exactly once
    expect(slots.sort((a, b) => a - b)).toEqual(
      Array.from({ length: 30 }, (_, i) => i)
    );
  });
});
