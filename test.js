const axios = require('axios');

// Replace with your actual video URL
const videoUrl = 'https://v3.fal.media/files/elephant/QSQ33eXSXNonMbjfL4dFG_tmph5qs3iao.mp4';

async function testProcessVideo() {
  try {
    console.log('Testing video processing endpoint...');
    const response = await axios.post('http://localhost:8080/process-video', {
      videoUrl
    });
    
    console.log('Success! Screenshot URL:', response.data.imageUrl);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testProcessVideo(); 