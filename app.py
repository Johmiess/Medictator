from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, redirect
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime, UTC
from gemini_transcriber import transcribe_audio
import sqlalchemy as sa
 
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
    medical_id = db.Column(db.String(50), nullable = True, unique = True)
    notes = db.Column(db.String(10000), nullable = False, default = "")
    history = db.Column(db.String(10000), nullable = True, default = "")
    status = db.Column(db.String(20), default = "Pending")
    date = db.Column(db.DateTime, default=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"Patient {self.id}: {self.name}"

# Function to check and update database schema
def update_db_schema():
    inspector = sa.inspect(db.engine)
    columns = [column['name'] for column in inspector.get_columns('patient')]
    
    # Create the table if it doesn't exist yet
    if 'patient' not in inspector.get_table_names():
        db.create_all()
        print("Database initialized with all tables")
        return
        
    # Check if status column exists and add it if needed
    if 'status' not in columns:
        print("Adding 'status' column to patient table...")
        # Add the status column
        db.session.execute(sa.text('ALTER TABLE patient ADD COLUMN status VARCHAR(20)'))
        # Set default status for existing records
        db.session.execute(sa.text('UPDATE patient SET status = "Pending" WHERE status IS NULL'))
        db.session.commit()
        print("Status column added successfully")
    
    # Check if medical_id column exists and add it if needed
    if 'medical_id' not in columns:
        print("Adding 'medical_id' column to patient table...")
        # Add the medical_id column WITHOUT the UNIQUE constraint
        db.session.execute(sa.text('ALTER TABLE patient ADD COLUMN medical_id VARCHAR(50)'))
        # Generate unique medical IDs for existing records to avoid constraint violations
        patients = Patient.query.all()
        for i, patient in enumerate(patients):
            if not patient.medical_id:
                patient.medical_id = f"MED{patient.id}{i:04d}"
        db.session.commit()
        print("Medical ID column added successfully")
        
        try:
            # Now attempt to enforce uniqueness by creating an index
            # This won't work directly in SQLite but we'll attempt it for other DBs
            db.session.execute(sa.text('CREATE UNIQUE INDEX idx_unique_medical_id ON patient (medical_id) WHERE medical_id IS NOT NULL'))
            db.session.commit()
            print("Unique index on medical_id created")
        except Exception as e:
            print(f"Note: Could not create unique index: {e}")
            print("This is normal for SQLite. The application will enforce uniqueness.")
            pass
        
    # Check if history column exists and add it if needed
    if 'history' not in columns:
        print("Adding 'history' column to patient table...")
        # Add the history column
        db.session.execute(sa.text('ALTER TABLE patient ADD COLUMN history TEXT'))
        db.session.commit()
        print("History column added successfully")
    
    # Fix any null notes values
    print("Ensuring no NULL values in notes column...")
    db.session.execute(sa.text('UPDATE patient SET notes = "" WHERE notes IS NULL'))
    db.session.commit()
    print("Notes column updated successfully")

# Function to create sample patients if none exist
def create_sample_patients():
    # Check if there are any patients in the database
    patient_count = Patient.query.count()
    if patient_count == 0:
        print("Creating sample patients...")
        sample_patients = [
            Patient(name="John Doe", age=35, sex="Male", status="Pending", 
                   medical_id="MED123456",
                   notes="Patient reports headaches||BP: 120/80||Possible migraine||Prescribe pain medication"),
            Patient(name="Jane Smith", age=28, sex="Female", status="Completed", 
                   medical_id="MED789012",
                   notes="Regular checkup||All vitals normal||Healthy||Follow up in 1 year"),
            Patient(name="Bob Johnson", age=42, sex="Male", status="Updates", 
                   medical_id="MED345678",
                   notes="Back pain||X-ray shows mild disc degeneration||Degenerative disc disease||Physical therapy")
        ]
        
        for patient in sample_patients:
            db.session.add(patient)
        
        db.session.commit()
        print("Sample patients created successfully")
    
#Home Page Routes
@app.route('/', methods=["POST","GET"])
def home():
    #Add a patient
    if request.method == "POST":
        patient_name = request.form['name']
        patient_age = request.form['age']
        patient_sex = request.form['sex']
        patient_medical_id = request.form.get('medical_id', '').strip() or None  # Handle empty string as None
        
        # Check if medical_id is unique if provided
        if patient_medical_id:
            existing_patient = Patient.query.filter_by(medical_id=patient_medical_id).first()
            if existing_patient:
                return render_template('homepage.html', 
                                       patients=Patient.query.order_by(Patient.date.desc()).all(),
                                       error=f"Error: Medical ID '{patient_medical_id}' is already in use. Please use a unique Medical ID.")
        
        new_patient = Patient(
            name=patient_name,
            age=patient_age,
            sex=patient_sex,
            medical_id=patient_medical_id
        )
        
        try:
            db.session.add(new_patient)
            db.session.commit()
            return redirect("/")
        except Exception as e:
            db.session.rollback()
            error_message = str(e)
            if "UNIQUE constraint failed: patient.medical_id" in error_message:
                error_message = f"Medical ID '{patient_medical_id}' is already in use. Please use a unique Medical ID."
            
            print(f"ERROR: {error_message}")
            patients = Patient.query.order_by(Patient.date.desc()).all()
            return render_template('homepage.html', patients=patients, error=f"Error: {error_message}")
    else:
        patients = Patient.query.order_by(Patient.date.desc()).all()
        return render_template('homepage.html', patients=patients)


@app.route('/upload', methods=['POST'])

def upload_file():
    if 'audio' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'recording_{timestamp}.mp3'
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    
    return jsonify({'success': True, 'filename': filename})

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

@app.route('/patient/<int:id>', methods=['GET', 'DELETE', 'PUT'])
def patient(id):
    patient = Patient.query.get_or_404(id)
    
    if request.method == 'GET':
        return render_template('patientpage.html', patient=patient)
    
    elif request.method == 'DELETE':
        try:
            db.session.delete(patient)
            db.session.commit()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        # Check if medical_id is being updated and if it's unique
        if 'medical_id' in data and data['medical_id'] != patient.medical_id:
            medical_id = data['medical_id'].strip() if data['medical_id'] else None
            
            if medical_id:
                existing_patient = Patient.query.filter_by(medical_id=medical_id).first()
                if existing_patient and existing_patient.id != patient.id:
                    return jsonify({"error": f"Medical ID '{medical_id}' is already in use by another patient"}), 400
        
        if 'name' in data:
            patient.name = data['name']
        if 'age' in data:
            patient.age = data['age']
        if 'sex' in data:
            patient.sex = data['sex']
        if 'medical_id' in data:
            patient.medical_id = data['medical_id'].strip() if data['medical_id'] else None
        if 'notes' in data:
            patient.notes = data['notes']
        if 'history' in data:
            patient.history = data['history']
        if 'status' in data:
            patient.status = data['status']
        
        try:
            db.session.commit()
            return jsonify({"success": True})
        except Exception as e:
            db.session.rollback()
            error_message = str(e)
            if "UNIQUE constraint failed: patient.medical_id" in error_message:
                return jsonify({"error": f"Medical ID is already in use by another patient"}), 400
            return jsonify({"error": error_message}), 500

if __name__ == '__main__':
    with app.app_context():
        update_db_schema()
        create_sample_patients()
    app.run(debug=True)