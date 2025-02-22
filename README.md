# Video Streaming Platform (Phase 1)

## Overview

This project is a video streaming platform that allows users to upload videos, process them into HLS format, and stream them using AWS CloudFront URLs. This is the first phase of development, focusing on core functionality. Future phases will include a custom video player, analytics, and an SDK.

## Features

- **Video Upload**: Users can upload videos to the platform.
- **Processing**: Videos are converted to HLS format.
- **Storage**: Processed videos are stored in AWS S3.
- **Streaming**: Videos are streamed securely via AWS CloudFront.
- **Access Control**: Secure HLS URLs are provided to users.

---

## Tech Stack

### **Frontend**

- Next.js (for dashboard and upload interface)
- React (for UI components)

### **Backend**

- Next.js Server Actions (for handling API requests)
- Drizzle ORM (for database interactions)
- PostgreSQL (for storing user data and video metadata)
- AWS S3 (for video storage)
- AWS Elemental MediaConvert (for video processing)
- AWS CloudFront (for secure video streaming)
- AWS SQS (for queue management)

---

## System Architecture

1. **User uploads a video** → Stored temporarily in S3.
2. **Video is added to SQS queue** → Triggers processing.
3. **AWS Elemental MediaConvert processes video** → Converts it to HLS.
4. **Processed video is stored in S3** → Ready for streaming.
5. **CloudFront serves video securely** → Users get an HLS URL.

---

## API Endpoints

### **1. Upload Video**

**POST `/api/upload`**

- Accepts a video file and uploads it to S3.
- Adds the video to the SQS queue for processing.

### **2. Check Video Status**

**GET `/api/status?videoId={id}`**

- Returns video status (`uploading`, `processing`, `done`).

### **3. Get Streaming URL**

**GET `/api/stream?videoId={id}`**

- Returns the CloudFront HLS streaming URL.

---

## Queue Management (AWS SQS)

- **Messages contain video ID and metadata.**
- **Worker pulls from the queue** and triggers AWS MediaConvert.
- **After processing, S3 URL is updated in the database.**

---

## Database Schema (PostgreSQL + Drizzle ORM)

```sql
CREATE TABLE videos (
                        id UUID PRIMARY KEY,
                        user_id UUID REFERENCES users(id),
                        status TEXT CHECK (status IN ('uploading', 'processing', 'done')),
                        s3_input_url TEXT,
                        s3_output_url TEXT,
                        created_at TIMESTAMP DEFAULT NOW()
);
```

---

## TODO List (Phase 1 in Detail)

### **Project Setup**

- [x] Initialize Next.js project with TypeScript
- [x] Set up Drizzle ORM with PostgreSQL
- [ ] Configure environment variables for AWS services

### **Frontend Development**

- [ ] Create a user dashboard with a video upload interface
- [ ] Implement a progress indicator for uploads
- [ ] Display a list of uploaded videos with status indicators
- [ ] Implement video playback using an embedded HLS player

### **Backend Development**

- [ ] Implement API for video uploads (Next.js Server Actions)
- [ ] Store uploaded video metadata in PostgreSQL
- [ ] Implement API to check video processing status
- [ ] Implement API to retrieve streaming URLs

### **AWS Integration**

- [ ] Set up AWS S3 for temporary and processed video storage
- [ ] Configure AWS Elemental MediaConvert for HLS conversion
- [ ] Set up AWS CloudFront for secure video streaming
- [ ] Implement AWS SQS for queue management

### **Queue Processing & Workflow**

- [ ] Implement worker to pull jobs from SQS
- [ ] Process videos using AWS MediaConvert
- [ ] Update database with processed video URL

### **Security & Access Control**

- [ ] Generate signed CloudFront URLs for secure access
- [ ] Implement authentication for user dashboard
- [ ] Restrict access to video URLs based on user authentication

### **Testing & Optimization**

- [ ] Write unit and integration tests for API endpoints
- [ ] Optimize file uploads for large video files
- [ ] Implement retry logic for failed jobs in SQS
- [ ] Optimize database queries for better performance

### **Deployment & Monitoring**

- [ ] Deploy Next.js frontend and backend to production
- [ ] Set up logging and monitoring for AWS services
- [ ] Implement error handling and alerting for failed video processing jobs

---

## Next Steps

After the core streaming functionality is complete, we will move on to:

1. **User Authentication & Billing System**
2. **Analytics Dashboard**
3. **Custom Video Player & SDK**
