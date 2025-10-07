import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectMongo, College, Review, Favorite } from './db.js';
import mongoose from 'mongoose';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Helpers
function mapCollege(row) {
  return {
    id: row._id,
    name: row.name,
    location: row.location,
    course: row.course,
    fee: row.fee,
  };
}

app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully on Render!");
});


// GET /colleges with filters and sorting
app.get('/colleges', async (req, res) => {
  const querySchema = z.object({
    location: z.string().optional(),
    course: z.string().optional(),
    search: z.string().optional(),
    minFee: z.coerce.number().optional(),
    maxFee: z.coerce.number().optional(),
    sort: z.enum(['fee_asc', 'fee_desc']).optional(),
  });

  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
  const { location, course, search, minFee, maxFee, sort } = parsed.data;

  const filter = {};
  if (location) filter.location = location;
  if (course) filter.course = course;
  if (typeof minFee === 'number' || typeof maxFee === 'number') {
    filter.fee = {};
    if (typeof minFee === 'number') filter.fee.$gte = minFee;
    if (typeof maxFee === 'number') filter.fee.$lte = maxFee;
  }
  if (search) filter.name = { $regex: search, $options: 'i' };
  const sortObj = sort === 'fee_asc' ? { fee: 1 } : sort === 'fee_desc' ? { fee: -1 } : { _id: -1 };
  const rows = await College.find(filter).sort(sortObj).lean();
  res.json(rows.map(mapCollege));
});

// Reviews endpoints (name only)
const reviewSchema = z.object({
  collegeName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

app.post('/reviews', async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const { collegeName, rating, comment } = parsed.data;
  const college = await College.findOne({ name: { $regex: `^${collegeName}$`, $options: 'i' } }).lean();
  if (!college) return res.status(404).json({ error: 'College not found' });
  const created = await Review.create({ collegeId: college._id, collegeName: college.name, rating, comment });
  res.status(201).json(created);
});

app.get('/reviews', async (_req, res) => {
  const rows = await Review.find().sort({ createdAt: -1 }).lean();
  res.json(rows);
});

app.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Review.deleteOne({ _id: id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (_e) {
    return res.status(400).json({ error: 'Invalid id' });
  }
});

// Favorites endpoints (name only)
const favSchema = z.object({
  collegeName: z.string().min(1),
});

app.post('/favorites', async (req, res) => {
  const parsed = favSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const { collegeName } = parsed.data;
  const college = await College.findOne({ name: { $regex: `^${collegeName}$`, $options: 'i' } });
  if (!college) return res.status(404).json({ error: 'College not found' });
  const existingFav = await Favorite.findOne({ collegeId: college._id });
  if (existingFav) return res.status(200).json(existingFav);
  const fav = await Favorite.create({ collegeId: college._id });
  res.status(201).json(fav);
});

app.get('/favorites', async (_req, res) => {
  const rows = await Favorite.find().sort({ createdAt: -1 }).populate('collegeId').lean();
  const mapped = rows.map((r) => ({
    id: r._id,
    collegeId: r.collegeId?._id,
    name: r.collegeId?.name,
    location: r.collegeId?.location,
    course: r.collegeId?.course,
    fee: r.collegeId?.fee,
    createdAt: r.createdAt,
  }));
  res.json(mapped);
});

app.delete('/favorites/:id', async (req, res) => {
  const id = req.params.id;
  const result = await Favorite.deleteOne({ _id: id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function main() {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});


