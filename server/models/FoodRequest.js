const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorDetails: {
    businessName: { type: String, required: true },
    businessType: { type: String, enum: ['mess', 'hotels_restaurants', 'party_gathering', 'other'], default: 'other' },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String, default: '' },
    pickupAddress: { type: String, required: true },
  },
  foodType: {
    type: String,
    enum: ['dal_roti', 'cooked_meals', 'rice_items', 'bread_bakery', 'fruits_vegetables', 'snacks', 'sweets_desserts', 'beverages', 'packaged_food', 'other'],
    required: true,
  },
  foodName: { type: String, required: true },
  quantity: { type: Number, required: true }, // kg or servings
  shelfLifeHours: { type: Number, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  category: {
    type: String,
    enum: ['fresh_food', 'packaged_food', 'perishable_food', 'dry_food'],
    default: 'fresh_food',
  },
  quantityUnit: {
    type: String,
    enum: ['plates', 'kg', 'litres', 'packets', 'persons_served'],
    default: 'kg',
  },
  preparationDate: { type: Date, required: true },
  preparationTime: { type: String, required: true },
  storageCondition: {
    type: String,
    enum: ['room_temperature', 'refrigerated', 'packed'],
    required: true,
  },
  foodImage: { type: String, default: '' },
  foodUsabilityCategory: {
    type: String,
    enum: ['human_edible', 'animal_edible', 'fertilizer_compost'],
    required: true,
  },
  foodQualityStatus: {
    type: String,
    enum: ['fresh', 'safe_but_urgent', 'risky_not_recommended'],
    default: 'safe_but_urgent',
  },
  qualityRecommendation: {
    type: String,
    enum: ['human_donation', 'animal_feeding', 'compost_fertilizer'],
    default: 'human_donation',
  },
  safeConsumptionUntil: { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
  },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pickedAt: { type: Date, default: null },
  dispatchedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FoodRequest', foodRequestSchema);
