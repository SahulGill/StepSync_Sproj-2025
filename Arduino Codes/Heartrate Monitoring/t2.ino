#include <WiFi.h>
#include <WiFiAP.h>
#include <WiFiClient.h>
#include <WiFiGeneric.h>
#include <WiFiMulti.h>
#include <WiFiSTA.h>
#include <WiFiScan.h>
#include <WiFiServer.h>
#include <WiFiType.h>
#include <WiFiUdp.h>

#include <Wire.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include "MAX30105.h"
#include "heartRate.h"

MAX30105 particleSensor;

// WiFi credentials
const char* ssid = "<Wifi-name>";
const char* password = "<password>";

// WebSocket server on port 81
WebSocketsServer webSocket = WebSocketsServer(81);

const int MAX_READINGS = 10;
float bpmReadings[MAX_READINGS];
int bpmIndex = 0;
bool bpmArrayFilled = false;

void setup() {
  Serial.begin(115200);
  Wire.begin(20, 21); // SDA, SCL pins
  
  // Initialize MAX30102
  if (!particleSensor.begin(Wire)) {
    Serial.println("MAX30102 not found. Check wiring.");
    while (1);
  }
  
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0xFF);
  particleSensor.setPulseAmplitudeGreen(0);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());
  
  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("WebSocket server started on port 81");
}

void loop() {
  webSocket.loop();
  
  static unsigned long lastSend = 0;
  const unsigned long SEND_INTERVAL = 2000; // Send every 2 seconds
  
  long irValue = particleSensor.getIR();
  
  // Skip if IR signal is too weak
  if (irValue < 5000) return;
  
  if (checkForBeat(irValue)) {
    static unsigned long lastBeat = 0;
    unsigned long now = millis();
    unsigned long delta = now - lastBeat;
    lastBeat = now;
    
    float bpm = 60.0 / (delta / 1000.0);
    
    if (bpm > 40 && bpm < 180) {
      bpmReadings[bpmIndex++] = bpm;
      if (bpmIndex >= MAX_READINGS) {
        bpmIndex = 0;
        bpmArrayFilled = true;
      }
    }
  }
  
  // Send current averaged BPM every 2 seconds (regardless of new beats)
  if (millis() - lastSend >= SEND_INTERVAL) {
    int readings = bpmArrayFilled ? MAX_READINGS : bpmIndex;
    
    if (readings > 0) { // Only send if we have readings
      float sum = 0;
      for (int i = 0; i < readings; i++) {
        sum += bpmReadings[i];
      }
      
      float avgBPM = sum / readings;
      
      // Send BPM data via WebSocket
      DynamicJsonDocument doc(1024);
      doc["type"] = "heartRate";
      doc["bpm"] = round(avgBPM);
      doc["timestamp"] = millis();
      doc["readings"] = readings; // Debug info
      
      String message;
      serializeJson(doc, message);
      webSocket.broadcastTXT(message);
      
      Serial.print("Sending BPM: ");
      Serial.print(avgBPM);
      Serial.print(" (");
      Serial.print(readings);
      Serial.println(" readings)");
    }
    
    lastSend = millis();
  }
  
  delay(20);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      
      // Send welcome message
      DynamicJsonDocument doc(1024);
      doc["type"] = "connected";
      doc["message"] = "ESP32 Heart Rate Monitor Connected";
      
      String message;
      serializeJson(doc, message);
      webSocket.sendTXT(num, message);
      break;
    }
      
    case WStype_TEXT:
      Serial.printf("[%u] Received: %s\n", num, payload);
      break;
      
    default:
      break;
  }
}

// #include <Wire.h>
// #include <WiFi.h>
// #include <WebSocketsServer.h>
// #include <ArduinoJson.h>
// #include "MAX30105.h"
// #include "heartRate.h"

// MAX30105 particleSensor;

// // WiFi credentials
// const char* ssid = "WiFi-Students-A";
// const char* password = "FccWiFi5500";

// // WebSocket server on port 81
// WebSocketsServer webSocket = WebSocketsServer(81);

// const int MAX_READINGS = 10;
// float bpmReadings[MAX_READINGS];
// int bpmIndex = 0;
// bool bpmArrayFilled = false;

// // Baseus PPADM205 Keep-Alive Variables
// unsigned long lastKeepAlive = 0;
// const unsigned long KEEP_ALIVE_INTERVAL = 20000; // 20 seconds for Baseus power banks
// const int LED_PIN = 8; // Built-in LED pin for ESP32-C3

// void setup() {
//   Serial.begin(115200);
//   Wire.begin(20, 21); // SDA, SCL pins
  
//   // Initialize LED for keep-alive
//   pinMode(LED_PIN, OUTPUT);
//   Serial.println("🔋 Baseus PPADM205 keep-alive mode enabled");
  
//   // Initialize MAX30102
//   if (!particleSensor.begin(Wire)) {
//     Serial.println("MAX30102 not found. Check wiring.");
//     while (1);
//   }
  
//   particleSensor.setup();
//   particleSensor.setPulseAmplitudeRed(0xFF);
//   particleSensor.setPulseAmplitudeGreen(0);
  
//   // Connect to WiFi
//   WiFi.begin(ssid, password);
//   Serial.print("Connecting to WiFi");
  
//   while (WiFi.status() != WL_CONNECTED) {
//     delay(500);
//     Serial.print(".");
//   }
  
//   Serial.println();
//   Serial.print("Connected! IP address: ");
//   Serial.println(WiFi.localIP());
  
//   // Start WebSocket server
//   webSocket.begin();
//   webSocket.onEvent(webSocketEvent);
  
//   Serial.println("WebSocket server started on port 81");
//   Serial.println("🚀 Ready to monitor heart rate and keep power bank alive!");
// }

// void loop() {
//   webSocket.loop();
  
//   static unsigned long lastSend = 0;
//   const unsigned long SEND_INTERVAL = 2000; // Send every 2 seconds
  
//   // Baseus PPADM205 Keep-Alive Check
//   if (millis() - lastKeepAlive >= KEEP_ALIVE_INTERVAL) {
//     baseusKeepAlive();
//     lastKeepAlive = millis();
//   }
  
//   long irValue = particleSensor.getIR();
  
//   // Skip if IR signal is too weak
//   if (irValue < 5000) return;
  
//   if (checkForBeat(irValue)) {
//     static unsigned long lastBeat = 0;
//     unsigned long now = millis();
//     unsigned long delta = now - lastBeat;
//     lastBeat = now;
    
//     float bpm = 60.0 / (delta / 1000.0);
    
//     if (bpm > 40 && bpm < 180) {
//       bpmReadings[bpmIndex++] = bpm;
//       if (bpmIndex >= MAX_READINGS) {
//         bpmIndex = 0;
//         bpmArrayFilled = true;
//       }
//     }
//   }
  
//   // Send current averaged BPM every 2 seconds (regardless of new beats)
//   if (millis() - lastSend >= SEND_INTERVAL) {
//     int readings = bpmArrayFilled ? MAX_READINGS : bpmIndex;
    
//     if (readings > 0) { // Only send if we have readings
//       float sum = 0;
//       for (int i = 0; i < readings; i++) {
//         sum += bpmReadings[i];
//       }
      
//       float avgBPM = sum / readings;
      
//       // Send BPM data via WebSocket
//       DynamicJsonDocument doc(1024);
//       doc["type"] = "heartRate";
//       doc["bmp"] = round(avgBPM);
//       doc["timestamp"] = millis();
//       doc["readings"] = readings; // Debug info
      
//       String message;
//       serializeJson(doc, message);
//       webSocket.broadcastTXT(message);
      
//       Serial.print("💓 Sending BPM: ");
//       Serial.print(avgBPM);
//       Serial.print(" (");
//       Serial.print(readings);
//       Serial.println(" readings)");
//     }
    
//     lastSend = millis();
//   }
  
//   delay(20);
// }

// // Baseus PPADM205 Optimized Keep-Alive Function
// void baseusKeepAlive() {
//   Serial.println("🔋 Sending Baseus PPADM205 keep-alive pulse...");
  
//   // Method 1: LED Current Burst (Increases current draw)
//   for (int i = 0; i < 100; i++) {
//     digitalWrite(LED_PIN, HIGH);
//     delayMicroseconds(2000); // 2ms on
//     digitalWrite(LED_PIN, LOW);
//     delayMicroseconds(2000); // 2ms off
//   }
  
//   // Method 2: WiFi Activity Burst (Additional current draw)
//   if (webSocket.connectedClients() > 0) {
//     DynamicJsonDocument keepAliveDoc(300);
//     keepAliveDoc["type"] = "powerBankKeepAlive";
//     keepAliveDoc["model"] = "BaseusPPADM205";
//     keepAliveDoc["currentBoost"] = true;
//     keepAliveDoc["timestamp"] = millis();
    
//     String keepAliveMessage;
//     serializeJson(keepAliveDoc, keepAliveMessage);
//     webSocket.broadcastTXT(keepAliveMessage);
//   }
  
//   // Method 3: Brief Processing Burst (CPU activity)
//   volatile float tempCalc = 0;
//   for (int i = 0; i < 1000; i++) {
//     tempCalc += sqrt(i * 3.14159);
//   }
  
//   Serial.println("✅ Baseus keep-alive pulse sent - power bank should stay active");
// }

// void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
//   switch(type) {
//     case WStype_DISCONNECTED:
//       Serial.printf("🔌 [%u] Client Disconnected!\n", num);
//       break;
      
//     case WStype_CONNECTED: {
//       IPAddress ip = webSocket.remoteIP(num);
//       Serial.printf("🤝 [%u] New client connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      
//       // Send welcome message
//       DynamicJsonDocument doc(1024);
//       doc["type"] = "connected";
//       doc["message"] = "ESP32 Heart Rate Monitor Connected";
//       doc["powerBankModel"] = "BaseusPPADM205";
//       doc["keepAliveEnabled"] = true;
      
//       String message;
//       serializeJson(doc, message);
//       webSocket.sendTXT(num, message);
//       break;
//     }
      
//     case WStype_TEXT:
//       Serial.printf("📨 [%u] Received: %s\n", num, payload);
      
//       // Handle ping/pong for connection testing
//       if (strcmp((char*)payload, "ping") == 0) {
//         webSocket.sendTXT(num, "pong");
//       }
//       break;
      
//     default:
//       break;
//   }
// }
