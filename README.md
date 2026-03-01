
# ElderlyLN – AI-Powered Caregiver Management & Matching System

An AI - driven caregiver management and matching platform designed to improve trust, transparency, and accessibility in elderly care services in Sri Lanka.

The system enables families to find verified caregivers using an intelligent ML-based matching algorithm, while allowing administrators to manage verification and complaints efficiently.

---

## 📌 Project Overview

ElderlyLN is a trilingual (Sinhala / Tamil / English) mobile-based caregiver platform that:

- Matches families with suitable caregivers using machine learning.
- Allows caregivers to upload verification documents (NIC, Police Clearance, Certificates).
- Enables administrators to review and approve caregivers.
- Manages bookings, complaints, and reviews.

The system addresses issues such as:

- Lack of caregiver trust verification
- Language barriers
- Poor transparency in traditional caregiver hiring processes

---

## 🔎 Key Features

### 👩‍⚕️ Caregiver Module
- Profile creation & editing
- Document upload (NIC / Police Clearance / Certificates)
- Submit for verification
- Booking management
- Review visibility

### 👨‍👩‍👧 Family Module
- Search caregivers
- AI-based matching system
- Booking requests
- Review & rating system
- Complaint submission

### 👨‍💼 Admin Module
- Dashboard statistics
- Verification queue
- Caregiver document review
- Complaint resolution system
- Status management (Pending / Verified / Rejected)

---

## 🧰 Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Multer (Document Upload)

### Frontend
- React Native (Expo)
- i18n (Sinhala / Tamil / English)
- Axios (API communication)

### Machine Learning
- Python
- Random Forest Classifier
- Scikit-learn
- Joblib (Model persistence)
- Performance Metrics: Accuracy, Precision, Recall, F1-score

---

## 🧠 How AI Matching Works

1. Family enters care requirements  
2. Backend retrieves available caregivers  
3. Python ML model predicts suitability score  
4. System ranks caregivers  
5. Top matches are returned to the user  

---

## 📂 Project Structure
ElderlyLN/
│
├── backend/
│ ├── routes/
│ ├── services/
│ ├── utils/
│ ├── uploads/
│ ├── ml/
│ ├── db.js
│ ├── server.js
│ └── .env
│
├── elderlyLn-frontend/
│ ├── screens/
│ ├── i18n/
│ └── api/
│
└── README.md


---
---

# ⚙️ How to Run the Project

This project has two main parts:

1. Backend (Server)
2. Frontend (Mobile App)

Both must be running at the same time.

---

## 🟢 Step 1 – Start the Backend (Server)

The backend is the part that connects to the database and handles all logic.

### 1️⃣ Open a terminal

- On Mac: Open **Terminal**
- On Windows: Open **Command Prompt** or **PowerShell**

### 2️⃣ Go inside the backend folder

Type:

```
cd backend
```

Press Enter.

### 3️⃣ Install required packages

Type:

```
npm install
```

Wait until it finishes.

### 4️⃣ Start the server

Type:

```
npm start
```

If successful, you will see something like:

```
ElderlyLN Backend running on port 5001
Database Connection Connected successfully
```

That means the backend is working.

---

## 🤖 Step 2 – Setup Machine Learning (Only First Time)

This is needed for the AI matching feature.

Still inside the backend folder:

### Create virtual environment

Mac:
```
python3 -m venv .venv
```

Windows:
```
python -m venv .venv
```

### Activate it

Mac:
```
source .venv/bin/activate
```

Windows:
```
.venv\Scripts\activate
```

### Install ML libraries

```
pip install joblib pandas numpy scikit-learn scipy
```

You only need to do this once.

---

## 📱 Step 3 – Start the Frontend (Mobile App)

Open a **new terminal window** (keep backend running).

### 1️⃣ Go to frontend folder

```
cd elderlyLn-frontend
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Start Expo

```
npx expo start
```

Expo will open in your browser.

You can then:
- Press **a** for Android emulator
- Press **i** for iPhone simulator
- Or scan QR code using Expo Go app

---

## 🔗 Important – API Configuration

Inside the frontend, make sure the API URL is correct.

For Android Emulator:

```
http://10.0.2.2:5001
```

For real phone (same WiFi):

```
http://[YOUR_COMPUTER_IP]:5001
```

---

## 🚀 Running the Full System

You must run:

- Backend (Terminal 1)
- Frontend (Terminal 2)

Both must stay running while testing.

---

## 👨‍💻 Developed As

Final Year Research Project  
AI-Powered Caregiver Management & Matching System