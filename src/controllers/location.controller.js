// GET /location/search
async function searchLocation(req, res) {
  const { q } = req.query; 

  if (!q) {
    return res.status(400).json({ success: false, error: 'Search query (q) is required' });
  }

  const apiKey = process.env.LOCATIONIQ_API_KEY;
  const url = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(q)}&format=json`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ success: false, error: data.error });
  }

  res.status(200).json({ success: true, data });
}

module.exports = {
  searchLocation
};