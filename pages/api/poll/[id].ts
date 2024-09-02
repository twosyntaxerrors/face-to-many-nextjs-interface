import type { NextApiRequest, NextApiResponse } from 'next'

const API_TOKEN = process.env.REPLICATE_API_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!API_TOKEN) {
    return res.status(500).json({ message: 'REPLICATE_API_TOKEN is not set' });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch prediction status');
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error polling Replicate API', error: (error as Error).message });
  }
}