/**
 * Auto-classifies food based on shelf life.
 * > 6h  → edible       → NGOs / hospitals
 * 2-6h  → semi_edible  → animal shelters
 * ≤ 2h  → non_edible   → compost units
 */
function classifyFood(shelfLifeHours) {
  if (shelfLifeHours > 6) return 'edible';
  if (shelfLifeHours > 2) return 'semi_edible';
  return 'non_edible';
}

module.exports = { classifyFood };
