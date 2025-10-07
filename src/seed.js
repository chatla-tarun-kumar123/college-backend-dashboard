import { connectMongo, College, Favorite, Review } from './db.js';

const seedColleges = [
  { name: 'ABC Engineering College', location: 'Hyderabad', course: 'Computer Science', fee: 120000 },
  { name: 'XYZ Institute of Technology', location: 'Bangalore', course: 'Electronics', fee: 100000 },
  { name: 'Sunrise Business School', location: 'Chennai', course: 'MBA', fee: 150000 },
  { name: 'Greenfield Medical College', location: 'Hyderabad', course: 'MBBS', fee: 250000 },
];

async function seed() {
  await connectMongo();
  await Favorite.deleteMany({});
  await Review.deleteMany({});
  await College.deleteMany({});
  await College.insertMany(seedColleges);
  console.log(`Seeded ${seedColleges.length} colleges`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});


