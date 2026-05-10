import type { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';

export const getRules = async (req: Request, res: Response) => {
    try {
        let rules = await prisma.rule.findFirst();
        if (!rules) {
        rules = await prisma.rule.create({
            data: { enforceAlternateSeating: true, fillRoomsCompletely: true }
        });
        }
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
};

export const updateRules = async (req: Request, res: Response) => {
  try {
    const { enforceAlternateSeating, fillRoomsCompletely } = req.body;
    const existingRule = await prisma.rule.findFirst();
    
    if (existingRule) {
      const updatedRule = await prisma.rule.update({
        where: { id: existingRule.id },
        data: { enforceAlternateSeating, fillRoomsCompletely },
      });
      res.json(updatedRule);
    } else {
      res.status(404).json({ error: 'Rules not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rules' });
  }
};
