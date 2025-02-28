const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Initialize Google Cloud Storage
let storage;
try {
  // Check if credentials file exists
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json';
  
  if (fs.existsSync(credentialsPath)) {
    console.log(`Using credentials file: ${credentialsPath}`);
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: credentialsPath
    });
  } 
  // If no credentials file, try using direct credentials
  else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    console.log('Using direct credentials from environment variables');
    
    // Format the private key
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey
      }
    });
  } 
  // If no credentials provided, use default authentication
  else {
    console.log('No explicit credentials provided, using default authentication');
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
  }
} catch (error) {
  console.error('Error initializing Google Cloud Storage:', error);
  throw error;
}

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
const tempDir = process.env.TEMP_DIR || './temp';

// Ensure temp directory exists
fs.ensureDirSync(tempDir);

/**
 * Download video from URL to local file system
 * @param {string} videoUrl - URL of the video to download
 * @returns {Promise<string>} - Path to downloaded video file
 */
async function downloadVideo(videoUrl) {
  const videoId = uuidv4();
  const videoPath = path.join(tempDir, `${videoId}.mp4`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(videoPath));
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

/**
 * Extract screenshot from video
 * @param {string} videoPath - Path to video file
 * @returns {Promise<string>} - Path to screenshot image
 */
async function extractScreenshot(videoPath) {
  const screenshotId = uuidv4();
  const screenshotPath = path.join(tempDir, `${screenshotId}.jpg`);
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        folder: tempDir,
        filename: `${screenshotId}.jpg`,
        // Take screenshot at 20% of the video duration
        timestamps: ['20%']
      })
      .on('end', () => {
        resolve(screenshotPath);
      })
      .on('error', (err) => {
        reject(new Error(`Failed to extract screenshot: ${err.message}`));
      });
  });
}

/**
 * Upload image to Google Cloud Storage
 * @param {string} imagePath - Path to image file
 * @returns {Promise<string>} - Public URL of uploaded image
 */
async function uploadToGCS(imagePath) {
  const filename = path.basename(imagePath);
  const destination = `screenshots/${filename}`;
  
  try {
    await bucket.upload(imagePath, {
      destination,
      metadata: {
        contentType: 'image/jpeg',
      },
    });

    // Make the file publicly accessible
    await bucket.file(destination).makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${destination}`;
    return publicUrl;
  } catch (error) {
    throw new Error(`Failed to upload to Google Cloud Storage: ${error.message}`);
  }
}

/**
 * Clean up temporary files
 * @param {string[]} filePaths - Array of file paths to delete
 */
async function cleanupFiles(filePaths) {
  try {
    for (const filePath of filePaths) {
      await fs.remove(filePath);
    }
  } catch (error) {
    console.error(`Error cleaning up files: ${error.message}`);
  }
}

/**
 * Process video: download, extract screenshot, upload to GCS, and cleanup
 * @param {string} videoUrl - URL of the video to process
 * @returns {Promise<string>} - Public URL of the screenshot
 */
async function processVideo(videoUrl) {
  let videoPath = null;
  let screenshotPath = null;
  
  try {
    // Download video
    videoPath = await downloadVideo(videoUrl);
    
    // Extract screenshot
    screenshotPath = await extractScreenshot(videoPath);
    
    // Upload screenshot to GCS
    const imageUrl = await uploadToGCS(screenshotPath);
    
    return imageUrl;
  } catch (error) {
    throw error;
  } finally {
    // Clean up temporary files
    const filesToCleanup = [videoPath, screenshotPath].filter(Boolean);
    await cleanupFiles(filesToCleanup);
  }
}

module.exports = {
  processVideo
}; 