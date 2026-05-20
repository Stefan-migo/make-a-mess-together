/**
 * SlotAllocator — O(1) Set-based slot allocation with cooldown.
 * 
 * Manages 30 slots (0-29) for phone connections. Uses a free set
 * for O(1) allocation and a cooldown map to prevent thrashing
 * when phones briefly disconnect and reconnect.
 * 
 * Cooldown is explicit: free() immediately returns slot to pool.
 * startCooldown() prevents reuse for cooldownMs milliseconds.
 * The bridge calls startCooldown() on disconnect.
 * 
 * Spec: .specify/specs/01-bridge-server.md
 */

class SlotAllocator {
  /**
   * @param {number} maxSlots - Maximum number of slots (default: 30)
   * @param {number} cooldownMs - Cooldown duration in ms (default: 5000)
   */
  constructor(maxSlots = 30, cooldownMs = 5000) {
    this.maxSlots = maxSlots;
    this.cooldownMs = cooldownMs;

    // Set of available (free) slot numbers
    this._free = new Set();
    // Set of currently allocated slot numbers
    this._allocated = new Set();
    // Map slot -> expiry timestamp for cooldown
    this._cooldowns = new Map();
    // Map slot -> timeout ID for auto-expiry
    this._cooldownTimers = new Map();

    // Initialize free set with all slots
    for (let i = 0; i < maxSlots; i++) {
      this._free.add(i);
    }
  }

  /**
   * Allocate a slot. Skips slots currently on cooldown.
   * Chooses the lowest available slot.
   * @returns {number} Slot number, or -1 if all slots are occupied or on cooldown
   */
  allocate() {
    // Garbage collect expired cooldowns
    this._cleanExpiredCooldowns();

    if (this._free.size === 0) {
      return -1;
    }

    // Find the smallest free slot that is NOT on cooldown
    const sortedFree = [...this._free].sort((a, b) => a - b);
    for (const slot of sortedFree) {
      if (!this.isOnCooldown(slot)) {
        this._free.delete(slot);
        this._allocated.add(slot);
        return slot;
      }
    }

    // All free slots are on cooldown
    return -1;
  }

  /**
   * Free an allocated slot. Immediately returns to free pool.
   * Cooldown is NOT automatically started — call startCooldown() separately.
   * @param {number} slot - Slot number to free
   * @returns {boolean} True if slot was freed, false if not allocated
   */
  free(slot) {
    if (!this._allocated.has(slot)) {
      return false;
    }
    this._allocated.delete(slot);
    this._free.add(slot);
    return true;
  }

  /**
   * Start cooldown for a slot, preventing it from being allocated
   * for cooldownMs milliseconds. If the slot is currently allocated,
   * this does NOT free it — call free() first.
   * @param {number} slot
   */
  startCooldown(slot) {
    // Cancel any existing cooldown for this slot
    if (this._cooldownTimers.has(slot)) {
      clearTimeout(this._cooldownTimers.get(slot));
    }

    const expiry = Date.now() + this.cooldownMs;
    this._cooldowns.set(slot, expiry);

    // Auto-remove cooldown after duration
    const timer = setTimeout(() => {
      this._cooldowns.delete(slot);
      this._cooldownTimers.delete(slot);
      // Slot is already in free pool from free()
    }, this.cooldownMs);
    timer.unref();
    this._cooldownTimers.set(slot, timer);
  }

  /**
   * Check if a slot is currently on cooldown.
   * Automatically cleans up expired cooldowns.
   * @param {number} slot
   * @returns {boolean}
   */
  isOnCooldown(slot) {
    if (!this._cooldowns.has(slot)) return false;
    if (Date.now() >= this._cooldowns.get(slot)) {
      // Expired — clean up
      this._cooldowns.delete(slot);
      const timer = this._cooldownTimers.get(slot);
      if (timer) {
        clearTimeout(timer);
        this._cooldownTimers.delete(slot);
      }
      return false;
    }
    return true;
  }

  /**
   * Check if a slot is currently allocated.
   * @param {number} slot
   * @returns {boolean}
   */
  isAllocated(slot) {
    return this._allocated.has(slot);
  }

  /**
   * Get number of currently active (allocated) slots.
   * @returns {number}
   */
  get activeCount() {
    return this._allocated.size;
  }

  /**
   * Get array of currently allocated slot numbers.
   * @returns {number[]}
   */
  getAllocatedSlots() {
    return [...this._allocated].sort((a, b) => a - b);
  }

  /**
   * Clean up expired cooldown entries.
   * @private
   */
  _cleanExpiredCooldowns() {
    const now = Date.now();
    for (const [slot, expiry] of this._cooldowns) {
      if (now >= expiry) {
        this._cooldowns.delete(slot);
        const timer = this._cooldownTimers.get(slot);
        if (timer) {
          clearTimeout(timer);
          this._cooldownTimers.delete(slot);
        }
      }
    }
  }

  /**
   * Clean up all timers and reset state.
   */
  destroy() {
    for (const timer of this._cooldownTimers.values()) {
      clearTimeout(timer);
    }
    this._cooldownTimers.clear();
    this._cooldowns.clear();
    this._free.clear();
    this._allocated.clear();
  }
}

module.exports = { SlotAllocator };
