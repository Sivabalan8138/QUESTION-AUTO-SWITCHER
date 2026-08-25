import { Server, Socket } from 'socket.io';
import prisma from './prisma';

export const setupSockets = (io: Server) => {
  let timerValue = 0;
  let timerInterval: NodeJS.Timeout | null = null;
  let currentRoundId: string | null = null;
  let auctionState = 'IDLE'; // IDLE, BIDDING_OPEN, BIDDING_CLOSED, WINNER_CONFIRMED, COMPLETED

  const broadcastState = async () => {
    let roundData = null;
    let bids: any[] = [];
    if (currentRoundId) {
      roundData = await prisma.auctionRound.findUnique({
        where: { id: currentRoundId },
        include: { question: true, winner: true },
      });
      bids = await prisma.bid.findMany({
        where: { roundId: currentRoundId },
        include: { team: true },
        orderBy: { timestamp: 'desc' },
      });
    }
    
    io.emit('auction_state', {
      state: auctionState,
      timerValue,
      roundData,
      bids,
    });
  };

  const startTimer = (seconds: number) => {
    if (timerInterval) clearInterval(timerInterval);
    timerValue = seconds;
    broadcastState();

    timerInterval = setInterval(() => {
      if (timerValue > 0) {
        timerValue--;
        io.emit('timer_sync', { timerValue });
      } else {
        if (timerInterval) clearInterval(timerInterval);
        if (auctionState === 'BIDDING_OPEN') {
          auctionState = 'BIDDING_CLOSED';
          broadcastState();
        }
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
  };

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial state to new client
    broadcastState();

    // Admin Controls
    socket.on('admin_start_auction', async (data: { questionId: string }) => {
      // Create new round
      const round = await prisma.auctionRound.create({
        data: {
          questionId: data.questionId,
          status: 'BIDDING_OPEN',
        }
      });
      currentRoundId = round.id;
      auctionState = 'BIDDING_OPEN';
      startTimer(60); // Default 60s
    });

    socket.on('admin_timer_control', (data: { action: string, seconds?: number }) => {
      if (data.action === 'start') {
        startTimer(data.seconds || timerValue);
      } else if (data.action === 'pause') {
        stopTimer();
      } else if (data.action === 'stop') {
        stopTimer();
        timerValue = 0;
        if (auctionState === 'BIDDING_OPEN') auctionState = 'BIDDING_CLOSED';
        broadcastState();
      }
    });

    socket.on('admin_evaluate_winner', async (data: { winnerId: string, result: 'CORRECT' | 'WRONG' }) => {
      if (!currentRoundId) return;

      const bids = await prisma.bid.findMany({
        where: { roundId: currentRoundId, teamId: data.winnerId },
        orderBy: { amount: 'desc' },
        take: 1
      });

      const winningBidAmount = bids.length > 0 ? bids[0].amount : 0;
      const question = await prisma.auctionRound.findUnique({
        where: { id: currentRoundId },
        include: { question: true }
      });
      const basePoints = question?.question.basePoints || 0;

      let pointsChanged = 0;
      if (data.result === 'CORRECT') {
        pointsChanged = basePoints; // Win base points
      } else {
        pointsChanged = -winningBidAmount; // Lose bid amount
      }

      const team = await prisma.team.findUnique({ where: { id: data.winnerId } });
      if (!team) return;

      const newPoints = team.points + pointsChanged;

      await prisma.$transaction([
        prisma.auctionRound.update({
          where: { id: currentRoundId },
          data: {
            winnerId: data.winnerId,
            winningBid: winningBidAmount,
            result: data.result,
            status: 'COMPLETED'
          }
        }),
        prisma.team.update({
          where: { id: data.winnerId },
          data: { 
            points: newPoints,
            correctAnswers: data.result === 'CORRECT' ? team.correctAnswers + 1 : team.correctAnswers,
            wrongAnswers: data.result === 'WRONG' ? team.wrongAnswers + 1 : team.wrongAnswers,
          }
        }),
        prisma.scoreLog.create({
          data: {
            teamId: data.winnerId,
            roundId: currentRoundId,
            type: data.result === 'CORRECT' ? 'WIN_REWARD' : 'PENALTY',
            pointsChanged,
            previousPoints: team.points,
            newPoints,
            reason: `Auction ${data.result}`
          }
        })
      ]);

      auctionState = 'COMPLETED';
      io.emit('celebration', { teamId: data.winnerId, result: data.result });
      broadcastState();
    });

    // Client Bidding
    socket.on('place_bid', async (data: { teamId: string, amount: number, type: string }) => {
      if (auctionState !== 'BIDDING_OPEN' || !currentRoundId) return;

      // Validate team and points
      const team = await prisma.team.findUnique({ where: { id: data.teamId } });
      if (!team || team.points < data.amount) {
        socket.emit('bid_error', { message: 'Insufficient points or invalid team' });
        return;
      }

      await prisma.bid.create({
        data: {
          roundId: currentRoundId,
          teamId: data.teamId,
          amount: data.amount,
          type: data.type
        }
      });

      broadcastState();
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
