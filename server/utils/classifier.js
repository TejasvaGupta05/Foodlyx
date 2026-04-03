/**
 * Auto-classifies food based on shelf life.
 * > 8h  → fresh
 * 4-8h  → semi_perishable
 * 1-4h  → perishable
 * ≤1h   → packaged
 */
function classifyFood(shelfLifeHours) {
  if (shelfLifeHours >= 8) return 'fresh';
  if (shelfLifeHours >= 4) return 'semi_perishable';
  if (shelfLifeHours > 1) return 'perishable';
  return 'packaged';
}

module.exports = { classifyFood };
