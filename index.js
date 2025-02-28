const express = require('express');
const { processVideo } = require('./videoProcessor');
require('dotenv').config();

const app = express();
// Cloud Run will set PORT environment variable
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Video processing endpoint
app.post('/process-video', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    
    console.log(`Processing video from URL: ${videoUrl}`);
    
    // Process the video
    const imageUrl = await processVideo(videoUrl);
    
    // Return the image URL
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 