// Simple test endpoint
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(200).json({
    status: 'ok',
    message: 'Test endpoint works!',
    timestamp: new Date().toISOString()
  });
};



