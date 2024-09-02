import type { NextApiRequest, NextApiResponse } from 'next'

const API_TOKEN = process.env.REPLICATE_API_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!API_TOKEN) {
    return res.status(500).json({ message: 'REPLICATE_API_TOKEN is not set' });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Sending request to Replicate API...');
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseText = await response.text();
    console.log('Raw API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse API response as JSON:', error);
      return res.status(500).json({ message: 'Invalid response from Replicate API', rawResponse: responseText });
    }

    if (!response.ok) {
      console.error('API response not ok:', response.status, data);
      return res.status(response.status).json({ message: 'API request failed', error: data });
    }

    console.log('Successful API response:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ message: 'Error calling Replicate API', error: (error as Error).message });
  }
}