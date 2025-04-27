# LAHACKS Health App - Vue.js Version

This application allows recording patient medical information through voice recordings and uses AI to transcribe them into structured SOAP notes.

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/lahackshealth.git
cd lahackshealth
```

2. Install Python dependencies
```
pip install -r requirements.txt
```

3. Install Node.js dependencies
```
npm install
```

4. Create a `.env` file with your Gemini API key
```
GEMINI_API_KEY=your_api_key_here
```

### Running the Application

1. Start the Flask backend server
```
python app.py
```

2. In a separate terminal, start the Vue.js development server
```
npm run dev
```

3. Open your browser and navigate to:
- Flask app: http://localhost:5000
- Vue dev server: http://localhost:5173

## Usage

1. Navigate to the patient page
2. Click the microphone button to start recording
3. Speak the patient information
4. Click the microphone button again to stop recording
5. The application will transcribe the audio and populate the SOAP notes

## Project Structure

- `/static/js/` - Vue.js components and frontend code
- `/templates/` - HTML templates
- `/uploads/` - Directory where audio recordings are stored
- `app.py` - Flask application
- `gemini_transcriber.py` - Functions for transcribing audio with Google Gemini

## Technologies Used

- Backend: Flask, SQLAlchemy
- Frontend: Vue.js 3
- AI: Google Gemini API
- Build tools: Vite 