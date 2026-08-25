import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Get Leaderboard
router.get('/leaderboard', async (req, res) => {
  const teams = await prisma.team.findMany({
    orderBy: [
      { points: 'desc' },
      { correctAnswers: 'desc' },
    ],
  });
  res.json(teams);
});

// Get Active Teams for Bidding Dropdown
router.get('/teams/active', async (req, res) => {
  const teams = await prisma.team.findMany({
    where: { active: true },
    select: { id: true, name: true, points: true },
    orderBy: { name: 'asc' },
  });
  res.json(teams);
});

export default router;
