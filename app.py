from flask import Flask, render_template, request, redirect, url_for
import pandas as pd
from PIL import Image
from exifread import process_file

app = Flask(__name__)

# Função para obter metadados da imagem
def get_image_metadata(file_path):
    with open(file_path, 'rb') as f:
        tags = process_file(f)
    return tags

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return redirect(url_for('home'))

    file = request.files['file']

    if file.filename == '':
        return redirect(url_for('home'))

    # Salvar a imagem no servidor
    image_path = f"uploads/{file.filename}"
    file.save(image_path)

    # Obter metadados da imagem
    metadata = get_image_metadata(image_path)

    return render_template('upload.html', image_path=image_path, metadata=metadata)

if __name__ == '__main__':
    app.run(debug=True)
