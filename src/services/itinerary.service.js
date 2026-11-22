// src/services/itinerary.service.js
async function generateGroupItinerary({ group, destination, date, preferences, locations, guideSummary }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.status = 500;
    throw err;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `
You are a group hangout planner. Create a practical, realistic itinerary based on the details below.
Return ONLY valid JSON matching this exact structure:
{
  "title": "string",
  "destination": "string",
  "summary": "string",
  "schedule": [
    {
      "time": "string (e.g. 10:00 AM)",
      "activity": "string",
      "location": "string",
      "notes": "string"
    }
  ],
  "tips": ["string"]
}

Group Name: ${group?.name || 'Weekend Hangout'}
Members Count: ${group?.members?.length || 1}
Destination: ${destination}
Date / Timeframe: ${date || 'Flexible'}
Preferences: ${preferences || 'None specified'}
Suggested Locations: ${JSON.stringify(locations || [])}
Destination Guide Notes: ${guideSummary || 'None'}
`.trim();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errBody = await response.text();
    const err = new Error(`Gemini API error (${response.status}): ${errBody}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    const err = new Error('Gemini returned an empty response');
    err.status = 502;
    throw err;
  }

  return {
    model,
    itinerary: JSON.parse(rawText),
  };
}

module.exports = { generateGroupItinerary };