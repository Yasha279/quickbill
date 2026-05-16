import '../config/env.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import connectDB from '../config/db.js';

const products = [
  {
    name: 'Basmati Rice 5kg',
    sku: 'GRN-001',
    barcode: '8901001001001',
    category: 'Groceries',
    sellingPrice: 650,
    costPrice: 520,
    stock: 45,
    lowStockThreshold: 10,
    description: 'Premium aged basmati rice, perfect for biryani.',
  },
  {
    name: 'Sunflower Oil 1L',
    sku: 'OIL-001',
    barcode: '8901001001002',
    category: 'Groceries',
    sellingPrice: 145,
    costPrice: 118,
    stock: 8,
    lowStockThreshold: 15,
    description: 'Refined sunflower cooking oil.',
  },
  {
    name: 'Whole Wheat Atta 10kg',
    sku: 'GRN-002',
    barcode: '8901001001003',
    category: 'Groceries',
    sellingPrice: 420,
    costPrice: 350,
    stock: 30,
    lowStockThreshold: 8,
  },
  {
    name: 'Tata Tea Gold 500g',
    sku: 'BEV-001',
    barcode: '8901001001004',
    category: 'Beverages',
    sellingPrice: 285,
    costPrice: 240,
    stock: 5,
    lowStockThreshold: 12,
  },
  {
    name: 'Amul Butter 500g',
    sku: 'DAI-001',
    barcode: '8901001001005',
    category: 'Dairy',
    sellingPrice: 285,
    costPrice: 250,
    stock: 22,
    lowStockThreshold: 8,
  },
  {
    name: 'Britannia Good Day Cookies',
    sku: 'SNK-001',
    barcode: '8901001001006',
    category: 'Snacks',
    sellingPrice: 35,
    costPrice: 28,
    stock: 60,
    lowStockThreshold: 20,
  },
  {
    name: 'Colgate Toothpaste 200g',
    sku: 'HPC-001',
    barcode: '8901001001007',
    category: 'Personal Care',
    sellingPrice: 125,
    costPrice: 95,
    stock: 3,
    lowStockThreshold: 10,
  },
  {
    name: 'Surf Excel Matic 2kg',
    sku: 'HHC-001',
    barcode: '8901001001008',
    category: 'Household',
    sellingPrice: 420,
    costPrice: 360,
    stock: 18,
    lowStockThreshold: 6,
  },
  {
    name: 'Maggi Noodles 12-pack',
    sku: 'SNK-002',
    barcode: '8901001001009',
    category: 'Snacks',
    sellingPrice: 168,
    costPrice: 140,
    stock: 40,
    lowStockThreshold: 15,
  },
  {
    name: 'Fresh Milk 1L',
    sku: 'DAI-002',
    barcode: '8901001001010',
    category: 'Dairy',
    sellingPrice: 62,
    costPrice: 52,
    stock: 0,
    lowStockThreshold: 20,
    description: 'Farm fresh toned milk.',
  },
];

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  await Product.deleteMany({});

  const admin = await User.create({
    name: 'Meera Sharma',
    email: 'meera@quickbill.shop',
    password: 'admin123',
    role: 'admin',
  });

  await User.create({
    name: 'Ravi Kumar',
    email: 'ravi@quickbill.shop',
    password: 'staff123',
    role: 'staff',
  });

  await Product.insertMany(products);

  console.log('Seed completed!');
  console.log('Admin: meera@quickbill.shop / admin123');
  console.log('Staff: ravi@quickbill.shop / staff123');
  console.log(`Created ${products.length} products`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
