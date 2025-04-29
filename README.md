# Medictator – AI-Powered Medical Notes

**Medictator** is your AI sidekick for medical documentation. Record your voice, and let our app transcribe, structure, and store your notes in the SOAP format—so you can focus on patients, not paperwork.

---

## 🚀 Features

- 🎤 **Voice-to-Text**: Record patient notes directly in the browser.
- 🧠 **AI-Powered SOAP Formatting**: Automatically organizes notes into Subjective, Objective, Assessment, and Plan.
- ☁️ **Cloud Storage**: Securely stores and retrieves patient records.
- ⚡ **Fast & Intuitive UI**: Modern, responsive interface for clinicians.

---

## 🛠️ Tech Stack

- **Backend**: Flask, SQLAlchemy
- **Frontend**: HTML/CSS/JS (Vanilla, no framework)
- **AI**: Google Gemini API
- **Database**: SQLite (default, easy setup)
- **Other**: dotenv for secrets, CORS, Pillow for image handling

---

## 🖥️ Setup & Installation Guide

### 1. Prerequisites

- Python 3.8+
- pip

### 2. Clone the Repository

```bash
git clone https://github.com/yourusername/medictator.git
cd medictator
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory and add your Gemini API key:
