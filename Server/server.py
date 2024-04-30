from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from ultralytics import YOLO

from PIL import Image
from io import BytesIO
import os
import base64
import cv2
import numpy as np
import socket

import tensorflow as tf
from keras.models import load_model
from tensorflow.keras.utils import img_to_array, load_img

from nanonets import NANONETSOCR
model = NANONETSOCR()
model.set_token('3d441d96-0590-11ef-850d-7a4a94e44568')

app = Flask(__name__)
CORS(app) # This will enable CORS for all routes

ObjectModel = YOLO('yolov8m.pt') # Load the object detection model
currencyModel = load_model('model.h5') # Load the currency detection model

# Define the currency map
currency_map = {0:"10", 1:"100", 2:"20", 3:"200", 4:"2000", 5:"50", 6:"500"} # Define the currency map

@app.route('/FaceDetection', methods=['POST'])
def FaceDetection():
    # Now we will extract the image uri from the request
    data = request.get_json()
    base64_string = data['base64']
    decoded = base64.b64decode(base64_string)
    image = Image.open(BytesIO(decoded))

    # Convert the image to RGB mode
    image = image.convert("RGB")

    # Save image as .jpeg
    image.save('Face_image.jpeg', 'JPEG')

    # Load the cascade
    face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

    # Read the image
    img = cv2.imread('Face_image.jpeg')

    # Convert the image to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)

    # Delete the image
    os.remove('Face_image.jpeg')

    return jsonify({"Faces" : len(faces), 'status': 200})


@app.route('/detect', methods=['POST'])
def detect():
    # Now we will extract the image uri from the request
    data = request.get_json()
    base64_string = data['base64']
    decoded = base64.b64decode(base64_string)

    image = Image.open(BytesIO(decoded))

    # Detect objects in image
    results = ObjectModel.predict(image)
    results = results[0]

    size = len(results.boxes)
    detected_objects = []
    
    for i in range(size):
        box = results.boxes[i]
        objectType = box.cls[0].item()
        name = results.names[objectType]
        detected_objects.append(name)

    return jsonify({"Detection" : detected_objects,'status': 200})

@app.route('/read', methods=['POST'])
def read():
    # Now we will extract the image uri from the request
    data = request.get_json()

    base64_string = data['base64']
    decoded = base64.b64decode(base64_string)
    image = Image.open(BytesIO(decoded))
    
    # Convert the image to RGB mode
    image = image.convert("RGB")

    # Save image as .png
    image.save('Read_image.jpeg', 'JPEG')

    # Read the text from the image
    model.convert_to_txt('Read_image.jpeg', output_file_name = 'read.txt')

    # Delete the image
    os.remove('Read_image.jpeg')

    return send_file('read.txt', as_attachment=True)

@app.route('/distance', methods=['POST'])
def distance():
    # Now we will extract the image uri from the request
    data = request.get_json()
    
    base64_string = data['base64']
    decoded = base64.b64decode(base64_string)
    image = Image.open(BytesIO(decoded))
    
    # Convert the image to RGB mode
    image = image.convert("RGB")

    # Save image as .jpeg
    image.save('Distance_image.jpeg', 'JPEG')

    depth = cv2.imread('Distance_image.jpeg', cv2.IMREAD_UNCHANGED) # Read the depth image

    # Calculate the distance
    distance = depth[depth.shape[0]//2, depth.shape[1]//2]
    distance = 0.1236 * np.tan(distance/2842.5 + 1.1863) * 1000

    # Delete the image
    os.remove('Distance_image.jpeg')

    return jsonify({"Distance" : distance, 'status': 200}) # Return the distance of the object from the camera

@app.route('/currency', methods=['POST'])
def currency():
    # Now we will extract the image uri from the request
    data = request.get_json()

    base64_string = data['base64']
    decoded = base64.b64decode(base64_string)
    image = Image.open(BytesIO(decoded))

    # Convert the image to RGB mode
    image = image.convert("RGB")

    # Save image as .jpeg
    image.save('Currency_image.jpeg', 'JPEG')    

    # Get the label of the currency
    label = get_label('Currency_image.jpeg')
    # print(label)

    # Get the Index of the Maximum Value in the Label
    index = -1
    max_value = -1
    for i in range(len(label)):
        if label[i] > max_value:
            max_value = label[i]
            index = i

    # Get the Currency
    currency = currency_map[index]
    print("Currency: ", currency)

    # Delete the image
    os.remove('Currency_image.jpeg')

    return jsonify({"Currency" : currency, 'status': 200}) # Return the currency of the image

# Helper functions
def get_label(file_path):
    processed_image = process_image(file_path)
    classes = currencyModel.predict(processed_image)
    predicted_labels = classes.tolist()[0]
    return predicted_labels

def process_image(file_path):
    img = load_img(file_path, target_size=(150,150))
    img = img_to_array(img)
    img = img.reshape(1,150,150,3).astype('float')
    img /= 255
    return img


if __name__ == '__main__':
    # Get the IP address and port number using socket
    Ip_address = socket.gethostbyname(socket.gethostname())
    Ip_port = 5000    
    app.run(debug=True, host=Ip_address, port=Ip_port)
