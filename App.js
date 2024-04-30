// Camera App

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { Camera } from "expo-camera";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system";

export default function App() {
  const Ip_address = "34.131.64.253";
  const Ip_port = "5000";

  const [camera, setCamera] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status === "granted") {
        setCamera(true);
      } else {
        alert("Access denied");
      }
    })();
  }, []);

  const speakText = async (text) => {
    await Speech.speak(text, { language: "en" });
  }

  const takePicture = async (mode) => {
    if (camera) {
      const data = await camera.takePictureAsync(null);
      // console.log(data.uri);

      // Convert uri to base64
      const base64 = await FileSystem.readAsStringAsync(data.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if(mode === 0){
        // Object Detection
        detection(base64);
      }
      else if(mode === 1){
        // Currency Detection
        CurrencyDetection(base64);
      }
      else if(mode === 2){
        // Text Detection
        readText(base64);
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    camera: {
      flex: 1,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 20,
    },
    button: {
      width: 100,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 10,
      backgroundColor: "white",
    },
    text: {
      fontSize: 20,
      color: "black",
    },
  });

  const detection = async (base64) => {
    try{
      const address = "http://"+Ip_address+":"+Ip_port+"/detect";
      
      let response = await fetch(address, {
        method: "POST",
        body: JSON.stringify({ base64: base64 }),
        headers: {
          "Content-Type": "application/json",
        },
        // mode: "no-cors",
      });
      let json = await response.json();
      
      let objects = json["Detection"];

      var dict = {};
      for(var i = 0 ; i < objects.length ; i++){
        if(objects[i] in dict){
          dict[objects[i]] += 1;
        }
        else{
          dict[objects[i]] = 1;
        }
      }

      let texts = "";
      for(var key in dict){
        texts += dict[key] + " " + key + " ";
      }

      // Play the detected objects
      speakText(texts);
    }
    catch (error) {
      console.error("Error:", error);
    }
  };

  const CurrencyDetection = async (base64) => {
    try{
      const address = "http://"+Ip_address+":"+Ip_port+"/currency";
      let response = await fetch(address, {
        method: "POST",
        body: JSON.stringify({ base64: base64 }),
        headers: {
          "Content-Type": "application/json",
        },
        // mode: "no-cors",
      });
      let json = await response.json();
      
      let object = json["Currency"];
      const currency = object;

      var note = "";
      if(currency === "10"){
        note = "Ten";
      }
      if(currency === "20"){
        note = "Twenty";
      }
      if(currency === "50"){
        note = "Fifty";
      }
      if(currency === "100"){
        note = "One Hundred" ;
      }
      if(currency === "500"){
        note = "Five Hundred";
      }
      if(currency === "2000"){
        note = "Two thousand";
      }
      note += " Rupees";
      // Play the detected objects
      speakText(note);
    }
    catch (error) {
      console.error("Error:", error);
    }
  }

  // const FaceDetection = async (base64) => {
  //   try{
  //     const address = "http://"+Ip_address+":"+Ip_port+"/FaceDetection";
  //     let response = await fetch(address, {
  //       method: "POST",
  //       body: JSON.stringify({ base64: base64 }),
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       // mode: "no-cors",
  //     });
  //     let json = await response.json();
      
  //     let objects = json["Faces"];

  //     console.log(objects);
  //   }
  //   catch (error) {
  //     console.error("Error:", error);
  //   }
  // }

  const readText = async (base64) => {
    try{
      const address = "http://"+Ip_address+":"+Ip_port+"/read";
      let response = await fetch(address, {
        method: "POST",
        body: JSON.stringify({ base64: base64 }),
        headers: {
          "Content-Type": "application/json",
        },
        // mode: "no-cors",
      });
      let texts = await response.text();

      // Play the detected objects
      speakText(texts);
    }
    catch (error) {
      console.error("Error:", error);
    }
  }

  if (camera === null) {
    return <View />;
  }

  // Camera View with buttons to take picture and detect objects for various modes
  return (
    <View style={styles.container}>
      <Camera
        ref={(ref) => setCamera(ref)}
        style={styles.camera}
        type={type}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => takePicture(0)} // Object Detection
        >
          <Text style={styles.text}>Object Detection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => takePicture(1)}    // Currency Detection
        >
          <Text style={styles.text}>Currency Detection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => takePicture(2)}   // Text Detection
        >
          <Text style={styles.text}>Text Detection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
