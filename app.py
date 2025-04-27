from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, redirect, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime, UTC
from gemini_transcriber import transcribe_audio, transcribe_word_for_word
 
load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#Data Class
class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable = False)
    age = db.Column(db.Integer, default = 0)
    sex = db.Column(db.String(40), nullable = False)
    notes = db.Column(db.String(10000), nullable = False)
    date = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"Task {self.id}"
    
#Home Page Routes
@app.route('/', methods=["POST","GET"])
def home():
    #Add a task
    if request.method == "POST":
        current_task = request.form['content']
        new_patient = Patient(content = current_task)
        try:
            db.session.add(new_patient)
            db.session.commit()
            return redirect("/")
        except Exception as e:
            print(f"ERROR:{e}")
            return f"ERROR:{e}"
    else:
        patients = Patient.query.order_by(Patient.name).all()
        return render_template('patientpage.html', patients=patients)


@app.route('/upload', methods=['POST'])
def upload_file():
    print('BACKEND REACHED: Uploading file to server')
    if 'audio' not in request.files:
        print('No file part')
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        print('No selected file')
        return jsonify({'error': 'No selected file'}), 400
    
    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'recording_{timestamp}.mp3'
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    # Get both types of transcriptions
    print('Transcribing audio (structured)')
    structured_transcription = transcribe_audio(file_path)
    print('Transcribing audio (word-for-word)')
    word_for_word = transcribe_word_for_word(file_path)
    print('Transcription complete')
    
    return jsonify({
        'success': True, 
        'filename': filename,
        'structured_transcription': structured_transcription,
        'word_for_word': word_for_word
    })

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

@app.route('/transcribe', methods=['POST'])
def handle_transcription():
    # Get filename from JSON request
    data = request.get_json()
    if not data or 'filename' not in data:
        return jsonify({'error': 'No filename provided'}), 400
    
    # Construct full file path
    file_path = os.path.join(UPLOAD_FOLDER, data['filename'])
    
    # Check if file exists
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    try:
        # Use the transcribe_audio function from gemini_transcriber.py
        transcription = transcribe_audio(file_path)
        return jsonify({'transcription': transcription})
    except Exception as e:
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)