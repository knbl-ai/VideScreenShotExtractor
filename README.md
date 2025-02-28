# Video Screenshot Extractor

A Node.js application that extracts screenshots from videos and uploads them to Google Cloud Storage.

## Features

- Accepts a video URL through an API endpoint
- Downloads the video to a temporary location
- Extracts a screenshot from the video
- Uploads the screenshot to Google Cloud Storage
- Returns the public URL of the uploaded image
- Cleans up temporary files after processing

## Prerequisites

- Node.js (v14 or higher)
- FFmpeg (automatically installed via ffmpeg-static package)
- Google Cloud Storage account and service account credentials
- Docker (for deployment)
- Google Cloud SDK (for deployment)

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   cd video-screenshot-extractor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy the `.env.example` file to `.env`
   - Update the values in the `.env` file with your Google Cloud credentials

4. Create a `temp` directory in the project root:
   ```
   mkdir temp
   ```

## Configuration

Update the `.env` file with your configuration:

```
PORT=3000
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----\n"
TEMP_DIR=./temp
```

To get your Google Cloud credentials:
1. Go to the Google Cloud Console
2. Navigate to IAM & Admin > Service Accounts
3. Create a new service account or select an existing one
4. Create a new key (JSON format)
5. Copy the `client_email` and `private_key` values from the downloaded JSON file to your `.env` file

## Local Usage

1. Start the server:
   ```
   npm start
   ```

2. Send a POST request to the `/process-video` endpoint with a JSON body containing the video URL:
   ```
   curl -X POST http://localhost:3000/process-video \
     -H "Content-Type: application/json" \
     -d '{"videoUrl": "https://example.com/video.mp4"}'
   ```

3. The server will respond with a JSON object containing the URL of the uploaded screenshot:
   ```json
   {
     "imageUrl": "https://storage.googleapis.com/your-bucket-name/screenshots/12345.jpg"
   }
   ```

## Deployment to Google Cloud Run

1. Make sure you have the Google Cloud SDK installed and configured.

2. Make sure Docker is installed and running.

3. Update the `deploy.sh` script with your project ID if needed.

4. Run the deployment script:
   ```
   ./deploy.sh
   ```

5. The script will:
   - Build a Docker image
   - Push it to Google Container Registry
   - Deploy it to Cloud Run
   - Display the service URL

6. Once deployed, you can use the service URL to make requests:
   ```
   curl -X POST https://your-service-url/process-video \
     -H "Content-Type: application/json" \
     -d '{"videoUrl": "https://example.com/video.mp4"}'
   ```

## API Endpoints

### POST /process-video

Processes a video from a URL and returns the URL of the extracted screenshot.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4"
}
```

**Response:**
```json
{
  "imageUrl": "https://storage.googleapis.com/your-bucket-name/screenshots/12345.jpg"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Missing or invalid parameters
- `500 Internal Server Error`: Server-side errors during processing

## License

MIT# VideScreenShotExtractor
