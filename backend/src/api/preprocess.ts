import { Request, Response } from 'express';
import { preprocessPrompt } from '../agents/preprocessor';
import type { PreprocessRequest } from '../types';

export async function handlePreprocess(req: Request, res: Response): Promise<void> {
  try {
    const { prompt }: PreprocessRequest = req.body;

    if (!prompt) {
      res.status(400).json({
        error: 'Missing required field: prompt',
      });
      return;
    }

    // Call Pre-processor agent
    const result = await preprocessPrompt(prompt);

    if (!result.success) {
      res.status(400).json({
        error: result.error,
        suggestions: result.data?.validation.warnings || [],
      });
      return;
    }

    res.json(result.data);
  } catch (error) {
    console.error('Preprocess endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
