import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectMongo() {
  try{
  const mongoUri = process.env.MONGO_URL;
  console.log(mongoUri);
  console.log(process.env.MONGO_DB);
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { dbName: process.env.MONGO_DB || 'aspire_next' });
  console.log('Connected to MongoDB');
  }catch(error){
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

const collegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    course: { type: String, required: true },
    fee: { type: Number, required: true },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    collegeName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const favoriteSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true, unique: true },
  },
  { timestamps: true }
);

export const College = mongoose.model('College', collegeSchema);
export const Review = mongoose.model('Review', reviewSchema);
export const Favorite = mongoose.model('Favorite', favoriteSchema);


