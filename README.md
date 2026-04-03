# ElderlyLN - AI-Powered Caregiver Management & Matching System

---

## Project Overview

ElderlyLN is an AI-driven caregiver management and matching platform designed to improve **trust, transparency, and accessibility** in elderly care services in Sri Lanka.

The system enables:

- Families to find verified caregivers using an intelligent ML-based matching algorithm  
- Caregivers to upload verification documents and manage bookings  
- Administrators to review, verify, and manage complaints efficiently  

The platform is fully trilingual: **Sinhala | Tamil | English**

---

## Key Features

### Caregiver Module
- Profile creation & editing  
- Verification document upload (NIC / Police Clearance / Certificates)  
- Submit profile for verification  
- Booking request management  
- Review visibility  

### Family Module
- Caregiver search & filtering  
- AI-based smart matching system  
- Booking requests  
- Review & rating system  
- Complaint submission  

### Admin Module
- Dashboard statistics  
- Verification queue management  
- Caregiver document review  
- Complaint resolution system  
- Status control (Pending / Verified / Rejected)  

---

## Tech Stack

#### Backend
- Node.js  
- Express.js  
- PostgreSQL  
- JWT Authentication  
- Multer (File Upload Handling)  

#### Frontend
- React Native (Expo)  
- i18n (Sinhala / Tamil / English)  
- Axios (API Communication)  

#### Machine Learning
- Python  
- Random Forest Classifier  
- Scikit-learn  
- Joblib (Model persistence)  
- Performance Metrics: Accuracy, Precision, Recall, F1-Score  

---

### How AI Matching Works

1. Family users enter care requirements  
2. The backend retrieves available caregivers  
3. The Python machine learning model calculates a suitability score  
4. Caregivers are ranked based on predicted suitability  
5. Top matches are returned to the user  

---

## System Modules

### Family User
Family users can register, log in, search for caregivers, view caregiver profiles, send booking requests, submit complaints, and provide reviews after completed services.

### Caregiver User
Caregivers can register, maintain their profiles, upload verification documents, submit profiles for verification, manage bookings, and monitor reviews and ratings.

### Administrator
Administrators can monitor dashboard statistics, review caregiver documents, manage the verification queue, approve or reject caregiver applications, and resolve complaints.

---

## Local Setup Guide

### Backend Setup

#### 1. Open Terminal / Command Prompt

#### 2. Navigate to the backend folder

```bash
cd backend
```

#### 3. Install dependencies

```
npm install
```

#### 4. Start backend server

```
npm start
```

If successful, you should see:

```
ElderlyLN Backend running on port 5001
Database Connection Connected successfully
```

---

### Machine Learning Setup (Required Once)

Inside backend folder:

#### Create virtual environment

Mac:
```
python3 -m venv .venv
```

Windows:
```
python -m venv .venv
```

#### Activate environment

Mac:
```
source .venv/bin/activate
```

Windows:
```
.venv\Scripts\activate
```

#### Install ML libraries

```
pip install joblib pandas numpy scikit-learn scipy
```

---

### Frontend Setup

Open a new terminal.

#### 1. Navigate to frontend folder

```
cd elderlyLn-frontend
```

#### 2. Install dependencies

```
npm install
```

#### 3. Start Expo

```
npx expo start
```

You can:
- Press **a** → Android emulator  
- Press **i** → iOS simulator  
- Scan QR using Expo Go  

---

### API Configuration

For Android Emulator:

```
http://10.0.2.2:5001
```

For real device (same WiFi):

```
http://[YOUR_LOCAL_IP]:5001
```

---

### Developed As

Final Year Research Project
AI-Powered Caregiver Management & Matching System
Developed to improve trust and accessibility in elderly care services in Sri Lanka

### Academic Note

This project combines mobile application development, backend system design, database integration, multilingual user support, and machine learning-based caregiver recommendation into one unified platform.