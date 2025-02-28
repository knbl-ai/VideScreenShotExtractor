#!/bin/bash

# Exit on any error
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  # Load all variables except GOOGLE_PRIVATE_KEY
  export $(cat .env | grep -v GOOGLE_PRIVATE_KEY | sed 's/#.*//g' | xargs)
fi

# Set the project ID
PROJECT_ID="poetic-analog-442510-e8"
REGION="us-central1"  # Default region
SERVICE_NAME="video-screenshot-extractor"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Create a service account key file
echo "Creating service account key file..."
cat > service-account-key.json << EOF
{
  "type": "service_account",
  "project_id": "$GOOGLE_CLOUD_PROJECT_ID",
  "private_key_id": "private-key-id",
  "private_key": $(grep GOOGLE_PRIVATE_KEY .env | cut -d '=' -f2-),
  "client_email": "$GOOGLE_CLIENT_EMAIL",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/$GOOGLE_CLIENT_EMAIL"
}
EOF

# Prepare environment variables string
ENV_VARS="GOOGLE_CLOUD_PROJECT_ID=$GOOGLE_CLOUD_PROJECT_ID,\
GOOGLE_CLOUD_BUCKET_NAME=$GOOGLE_CLOUD_BUCKET_NAME,\
TEMP_DIR=/tmp"

echo "🚀 Starting deployment process..."

# Set the correct project
echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Build the Docker image for linux/amd64 platform
echo "🏗️  Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t $SERVICE_NAME .

# Tag the image for Google Container Registry
echo "🏷️  Tagging image for GCR..."
docker tag $SERVICE_NAME $IMAGE_NAME

# Push the image to Google Container Registry
echo "⬆️  Pushing image to GCR..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300 \
  --port 8080 \
  --set-env-vars="$ENV_VARS" \
  --set-env-vars="GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/service-account-key.json"

# Remove the service account key file
rm service-account-key.json

echo "✅ Deployment completed!"

# Get the service URL
echo "🌍 Service URL:"
gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format='value(status.url)' 