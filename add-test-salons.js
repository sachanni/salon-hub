// Script to add test salons in Greater Noida area
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { salons } from './shared/schema.ts';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const testSalons = [
  {
    id: 'test-salon-1',
    name: 'Greenshire Beauty Salon',
    description: 'Professional beauty services in Greater Noida West',
    location: 'Shop no 101, Greenshire, Bhsrakh, Greater Noida West, Uttar Pradesh 201306',
    latitude: '28.5355', // Nirala Estate coordinates
    longitude: '77.3910',
    category: 'Hair Salon',
    priceRange: '$$',
    openTime: '9:00',
    closeTime: '21:00',
    phone: '+91-9876543210',
    email: 'greenshire@salon.com',
    website: 'https://greenshire-salon.com',
    rating: 4.5,
    reviewCount: 25,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test-salon-2',
    name: 'Nirala Estate Hair Studio',
    description: 'Modern hair studio in Nirala Estate',
    location: 'Nirala Estate, Tech Zone IV, Greater Noida West, Uttar Pradesh',
    latitude: '28.5360', // Close to Nirala Estate
    longitude: '77.3920',
    category: 'Hair Salon',
    priceRange: '$$$',
    openTime: '10:00',
    closeTime: '20:00',
    phone: '+91-9876543211',
    email: 'nirala@salon.com',
    website: 'https://nirala-salon.com',
    rating: 4.8,
    reviewCount: 42,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test-salon-3',
    name: 'Greater Noida Nail Art',
    description: 'Premium nail art and beauty services',
    location: 'Sector 1, Greater Noida West, Uttar Pradesh',
    latitude: '28.5340', // Within 1km of Nirala Estate
    longitude: '77.3900',
    category: 'Nail Salon',
    priceRange: '$$',
    openTime: '9:30',
    closeTime: '19:30',
    phone: '+91-9876543212',
    email: 'nails@salon.com',
    website: 'https://nails-salon.com',
    rating: 4.3,
    reviewCount: 18,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function addTestSalons() {
  try {
    console.log('Adding test salons...');
    
    for (const salon of testSalons) {
      await db.insert(salons).values(salon);
      console.log(`Added salon: ${salon.name}`);
    }
    
    console.log('Test salons added successfully!');
  } catch (error) {
    console.error('Error adding test salons:', error);
  }
}

addTestSalons();
