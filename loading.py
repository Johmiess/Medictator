from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def loading():
    return render_template('loading.html')

if __name__ == '__main__':
    app.run(debug=True, port=5002)  # Using port 5002 to avoid conflicts 