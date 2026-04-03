require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FoodRequest = require('./models/FoodRequest');
const { classifyFood } = require('./utils/classifier');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected for seeding...');

  await User.deleteMany();
  await FoodRequest.deleteMany();

  const users = await User.create([
    {
      name: 'Rajiv Sharma (Donor)',
      email: 'donor@foodlyx.com',
      password: 'pass123',
      role: 'donor',
      location: { lat: 28.6139, lng: 77.209 },
      impactScore: 120,
    },
    {
      name: 'Ananya NGO',
      email: 'ngo@foodlyx.com',
      password: 'pass123',
      role: 'ngo',
      location: { lat: 28.635, lng: 77.225 },
      isVerified: true,
    },
    {
      name: 'Green Paws Shelter',
      email: 'animal@foodlyx.com',
      password: 'pass123',
      role: 'animal_shelter',
      location: { lat: 28.62, lng: 77.195 },
      isVerified: true,
    },
    {
      name: 'EcoCompost Unit',
      email: 'compost@foodlyx.com',
      password: 'pass123',
      role: 'compost_unit',
      location: { lat: 28.64, lng: 77.21 },
    },
    {
      name: 'Admin',
      email: 'admin@foodlyx.com',
      password: 'admin123',
      role: 'admin',
      location: { lat: 28.61, lng: 77.2 },
    },
  ]);

  const donor = users.find((u) => u.role === 'donor');
  const ngo = users.find((u) => u.role === 'ngo');

  const requestsData = [
    { foodType: 'Biryani', quantity: 50, shelfLifeHours: 8, urgency: 'high', location: { lat: 28.614, lng: 77.209, address: 'Connaught Place, Delhi' } },
    { foodType: 'Bread & Butter', quantity: 30, shelfLifeHours: 4, urgency: 'medium', location: { lat: 28.613, lng: 77.208, address: 'India Gate, Delhi' } },
    { foodType: 'Vegetable Scraps', quantity: 20, shelfLifeHours: 1, urgency: 'low', location: { lat: 28.615, lng: 77.207, address: 'Lajpat Nagar, Delhi' } },
    { foodType: 'Paneer Curry', quantity: 40, shelfLifeHours: 7, urgency: 'high', location: { lat: 28.616, lng: 77.21, address: 'Karol Bagh, Delhi' } },
    { foodType: 'Rice Khichdi', quantity: 60, shelfLifeHours: 3, urgency: 'medium', location: { lat: 28.612, lng: 77.206, address: 'Sadar Bazaar, Delhi' } },
  ];

  for (const rd of requestsData) {
    const category = classifyFood(rd.shelfLifeHours);
    await FoodRequest.create({ ...rd, donorId: donor._id, category });
  }

  // Mark one as delivered (accepted by NGO)
  const all = await FoodRequest.find();
  await FoodRequest.findByIdAndUpdate(all[0]._id, { status: 'delivered', acceptedBy: ngo._id, deliveredAt: new Date() });

  console.log('✅ Seed complete!');
  console.log('Accounts:');
  console.log('  donor@foodlyx.com / pass123');
  console.log('  ngo@foodlyx.com / pass123');
  console.log('  animal@foodlyx.com / pass123');
  console.log('  compost@foodlyx.com / pass123');
  console.log('  admin@foodlyx.com / admin123');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
