from flask import Flask, render_template, url_for
import os

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates')

@app.route('/')
def home():
    return render_template('newpage.html')

if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Use a different port if your main app is running