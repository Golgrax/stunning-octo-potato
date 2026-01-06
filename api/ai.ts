import { Router, Request, Response } from 'express';
import { getAiRecommendation } from '../services/geminiService';

export const aiRouter = Router();

aiRouter.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { userPreference, menuItems } = req.body;
    
    if (!userPreference || !menuItems || !Array.isArray(menuItems)) {
      res.status(400).json({ error: 'Missing userPreference or menuItems array' });
      return; // Ensure function execution stops here
    }

    const result = await getAiRecommendation(userPreference, menuItems);
    res.json(JSON.parse(result));
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});
