# 🧓 ElderlyLN - AI-Powered Caregiver Management & Matching System

---

## 📌 Project Overview

ElderlyLN is an AI-driven caregiver management and matching platform designed to improve **trust, transparency, and accessibility** in elderly care services in Sri Lanka.

The system enables:

- Families to find verified caregivers using an intelligent ML-based matching algorithm  
- Caregivers to upload verification documents and manage bookings  
- Administrators to review, verify, and manage complaints efficiently  

The platform is fully trilingual: **Sinhala | Tamil | English**

---

## 🔎 Key Features

### 👩‍⚕️ Caregiver Module
- Profile creation & editing  
- Verification document upload (NIC / Police Clearance / Certificates)  
- Submit profile for verification  
- Booking request management  
- Review visibility  

### 👨‍👩‍👧 Family Module
- Caregiver search & filtering  
- AI-based smart matching system  
- Booking requests  
- Review & rating system  
- Complaint submission  

### 👨‍💼 Admin Module
- Dashboard statistics  
- Verification queue management  
- Caregiver document review  
- Complaint resolution system  
- Status control (Pending / Verified / Rejected)  

---

## 🧰 Tech Stack

#### 🚀 Backend
- Node.js  
- Express.js  
- PostgreSQL  
- JWT Authentication  
- Multer (File Upload Handling)  

#### 📱 Frontend
- React Native (Expo)  
- i18n (Sinhala / Tamil / English)  
- Axios (API Communication)  

#### 🤖 Machine Learning
- Python  
- Random Forest Classifier  
- Scikit-learn  
- Joblib (Model persistence)  
- Performance Metrics: Accuracy, Precision, Recall, F1-Score  

---

### 🧠 How AI Matching Works

1️⃣ Family enters care requirements  
2️⃣ Backend retrieves available caregivers  
3️⃣ Python ML model calculates suitability score  
4️⃣ Caregivers are ranked  
5️⃣ Top matches are returned to the user  

---

## ⚙️ Local Setup Guide

---

### 🟢 Backend Setup

#### 1️⃣ Open Terminal / Command Prompt

#### 2️⃣ Navigate to backend folder

```
cd backend
```

#### 3️⃣ Install dependencies

```
npm install
```

#### 4️⃣ Start backend server

```
npm start
```

If successful, you should see:

```
ElderlyLN Backend running on port 5001
Database Connection Connected successfully
```

---

### 🤖 Machine Learning Setup (Required Once)

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

### 📱 Frontend Setup

Open a new terminal.

#### 1️⃣ Navigate to frontend folder

```
cd elderlyLn-frontend
```

#### 2️⃣ Install dependencies

```
npm install
```

#### 3️⃣ Start Expo

```
npx expo start
```

You can:
- Press **a** → Android emulator  
- Press **i** → iOS simulator  
- Scan QR using Expo Go  

---

### 🔗 API Configuration

For Android Emulator:

```
http://10.0.2.2:5001
```

For real device (same WiFi):

```
http://[YOUR_LOCAL_IP]:5001
```

---

### 🎓 Developed As

Final Year Research Project  
AI-Powered Caregiver Management & Matching System  
Built for improving elderly care trust in Sri Lanka 🇱🇰