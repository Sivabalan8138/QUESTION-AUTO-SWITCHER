import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import multer from 'multer';
import * as xlsx from 'xlsx';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'electrobit2026';

// Middleware for Admin Auth
export const adminAuth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    jwt.verify(token, ADMIN_SECRET);
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// --- AUTH ---
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_SECRET) {
    const token = jwt.sign({ role: 'admin' }, ADMIN_SECRET, { expiresIn: '12h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// --- TEAMS ---
router.get('/teams', adminAuth, async (req, res) => {
  const teams = await prisma.team.findMany({ orderBy: { points: 'desc' } });
  res.json(teams);
});

router.post('/teams', adminAuth, async (req, res) => {
  const { name, registrationNo, college, points } = req.body;
  try {
    const team = await prisma.team.create({
      data: { name, registrationNo, college, points: points || 0 },
    });
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create team. Registration number might not be unique.' });
  }
});

router.put('/teams/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, registrationNo, college, points, active } = req.body;
  const team = await prisma.team.update({
    where: { id },
    data: { name, registrationNo, college, points, active },
  });
  res.json(team);
});

router.delete('/teams/:id', adminAuth, async (req, res) => {
  await prisma.team.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- QUESTIONS ---
router.get('/questions', adminAuth, async (req, res) => {
  const questions = await prisma.question.findMany();
  res.json(questions);
});

router.post('/questions', adminAuth, async (req, res) => {
  const { text, category, difficulty, basePoints, answer } = req.body;
  const question = await prisma.question.create({
    data: { text, category, difficulty, basePoints, answer },
  });
  res.json(question);
});

router.put('/questions/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { text, category, difficulty, basePoints, answer } = req.body;
  const question = await prisma.question.update({
    where: { id },
    data: { text, category, difficulty, basePoints, answer },
  });
  res.json(question);
});

router.delete('/questions/:id', adminAuth, async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.post('/questions/upload', adminAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const formattedData = data.map((row: any) => ({
      text: row.text,
      category: row.category,
      difficulty: row.difficulty,
      basePoints: parseInt(row.basePoints),
      answer: row.answer ? String(row.answer) : null,
    }));

    await prisma.question.createMany({ data: formattedData });
    res.json({ success: true, count: formattedData.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// --- HISTORY ---
router.get('/history/rounds', adminAuth, async (req, res) => {
  const rounds = await prisma.auctionRound.findMany({
    include: { question: true, winner: true, bids: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rounds);
});

router.delete('/history/clear', adminAuth, async (req, res) => {
  await prisma.scoreLog.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionRound.deleteMany();
  res.json({ success: true });
});

export default router;
