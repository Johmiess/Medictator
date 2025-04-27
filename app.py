from flask import Flask, render_template, request, jsonify, redirect
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime, UTC
 
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)