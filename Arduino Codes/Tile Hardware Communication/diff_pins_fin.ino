#include <FastLED.h>

// ===================== CONFIGURATION =====================
#define NUM_ROWS 2
#define NUM_COLS 4
#define NUM_TILES (NUM_ROWS * NUM_COLS)  // 8 tiles total
#define LEDS_PER_TILE 28
#define TOTAL_LEDS (NUM_TILES * LEDS_PER_TILE)  // 224 LEDs total

// LED Configuration - Separate data pins for each tile
#define LED_TYPE WS2812B
#define COLOR_ORDER GRB
#define BRIGHTNESS 100  // Adjust brightness (0-255)

// Data pins for each tile (8 separate pins)
const int ledDataPins[NUM_TILES] = {3, 5, 7, 9, 11, 13, A1, A3};

// Touch sensor pins (one per tile)
const int touchPins[NUM_TILES] = {2, 4, 6, 8, 10, 12, A0, A2};

// ===================== VARIABLES =====================
// Separate LED arrays for each tile
CRGB tile0[LEDS_PER_TILE];
CRGB tile1[LEDS_PER_TILE];
CRGB tile2[LEDS_PER_TILE];
CRGB tile3[LEDS_PER_TILE];
CRGB tile4[LEDS_PER_TILE];
CRGB tile5[LEDS_PER_TILE];
CRGB tile6[LEDS_PER_TILE];
CRGB tile7[LEDS_PER_TILE];

// Array of pointers to tile LED arrays for easy access
CRGB* tiles[NUM_TILES] = {tile0, tile1, tile2, tile3, tile4, tile5, tile6, tile7};

bool touchStates[NUM_TILES] = {false};
bool lastTouchStates[NUM_TILES] = {false};
unsigned long lastDebounceTime[NUM_TILES] = {0};
const unsigned long debounceDelay = 50; // 50ms debounce

// Color definitions
CRGB colorRed = CRGB(255, 0, 0);
CRGB colorGreen = CRGB(0, 255, 0);
CRGB colorBlue = CRGB(0, 0, 255);
CRGB colorYellow = CRGB(255, 255, 0);
CRGB colorOff = CRGB(0, 0, 0);

// Current tile colors (for tracking what color each tile should be)
CRGB tileColors[NUM_TILES];

// Serial communication
String inputString = "";
bool stringComplete = false;

// ===================== SETUP =====================
void setup() {
  Serial.begin(115200);
  Serial.println("Arduino Tile Controller Starting (Separate Data Pins)...");
  
  // Initialize LED strips - one for each tile with separate data pins
  FastLED.addLeds<LED_TYPE, 3, COLOR_ORDER>(tile0, LEDS_PER_TILE);
  FastLED.addLeds<LED_TYPE, 5, COLOR_ORDER>(tile1, LEDS_PER_TILE);
  FastLED.addLeds<LED_TYPE, 7, COLOR_ORDER>(tile2, LEDS_PER_TILE);
  FastLED.addLeds<LED_TYPE, 9, COLOR_ORDER>(tile3, LEDS_PER_TILE);
  FastLED.addLeds<LED_TYPE, 11, COLOR_ORDER>(tile4, LEDS_PER_TILE);
  FastLED.addLeds<LED_TYPE, 13, COLOR_ORDER>(tile5, LEDS_PER_TILE);
  FastLED.addLeds<LED_TYPE, A1, COLOR_ORDER>(tile6, LEDS_PER_TILE);
  FastLED.addLeds<LED_TYPE, A3, COLOR_ORDER>(tile7, LEDS_PER_TILE);
  
  FastLED.setBrightness(BRIGHTNESS);
  FastLED.clear();
  FastLED.show();
  
  // Initialize touch sensor pins
  for (int i = 0; i < NUM_TILES; i++) {
    pinMode(touchPins[i], INPUT_PULLUP);
    tileColors[i] = colorRed; // Default to red
  }
  
  // Initialize all tiles to red
  setAllTilesColor(colorRed);
  
  // Reserve string buffer for serial input
  inputString.reserve(200);
  
  Serial.println("Tile Controller Ready!");
  Serial.println("Pin Configuration:");
  for (int i = 0; i < NUM_TILES; i++) {
    int row = i / NUM_COLS;
    int col = i % NUM_COLS;
    Serial.print("Tile[");
    Serial.print(row);
    Serial.print(",");
    Serial.print(col);
    Serial.print("] -> Data Pin: ");
    Serial.print(ledDataPins[i]);
    Serial.print(", Touch Pin: ");
    Serial.println(touchPins[i]);
  }
}

// ===================== MAIN LOOP =====================
void loop() {
  readTouchSensors();
  processSerialInput();
  updateLEDs();
  
  delay(10); // Small delay for stability
}

// ===================== TOUCH SENSOR FUNCTIONS =====================
void readTouchSensors() {
  for (int i = 0; i < NUM_TILES; i++) {
    // Read sensor (inverted because of pull-up)
    bool currentReading = !digitalRead(touchPins[i]);
    
    // Debounce logic
    if (currentReading != lastTouchStates[i]) {
      lastDebounceTime[i] = millis();
    }
    
    if ((millis() - lastDebounceTime[i]) > debounceDelay) {
      if (currentReading != touchStates[i]) {
        touchStates[i] = currentReading;
        
        // Send touch state change to Unity
        sendTouchDataToUnity();
        
        // Optional: Add visual feedback for touch
        if (currentReading) {
          // Briefly brighten the tile when touched
          setTileBrightness(i, 255);
        } else {
          // Return to normal brightness
          setTileBrightness(i, BRIGHTNESS);
        }
      }
    }
    
    lastTouchStates[i] = currentReading;
  }
}

void sendTouchDataToUnity() {
  // Send comma-separated touch states
  for (int i = 0; i < NUM_TILES; i++) {
    Serial.print(touchStates[i] ? "1" : "0");
    if (i < NUM_TILES - 1) {
      Serial.print(",");
    }
  }
  Serial.println();
}

// ===================== LED CONTROL FUNCTIONS =====================
void setAllTilesColor(CRGB color) {
  for (int i = 0; i < NUM_TILES; i++) {
    setTileColor(i, color);
  }
}

void setTileColor(int tileIndex, CRGB color) {
  if (tileIndex < 0 || tileIndex >= NUM_TILES) return;
  
  tileColors[tileIndex] = color;
  
  // Set all LEDs in the specified tile to the given color
  for (int i = 0; i < LEDS_PER_TILE; i++) {
    tiles[tileIndex][i] = color;
  }
}

void setTileBrightness(int tileIndex, uint8_t brightness) {
  if (tileIndex < 0 || tileIndex >= NUM_TILES) return;
  
  // Temporarily set brightness for this tile
  for (int i = 0; i < LEDS_PER_TILE; i++) {
    tiles[tileIndex][i] = tileColors[tileIndex];
    tiles[tileIndex][i].nscale8(brightness);
  }
  
  FastLED.show();
}

void updateLEDs() {
  FastLED.show();
}

// ===================== SERIAL COMMUNICATION =====================
void processSerialInput() {
  if (stringComplete) {
    processCommand(inputString);
    inputString = "";
    stringComplete = false;
  }
}

void processCommand(String command) {
  command.trim();
  
  if (command.length() < 3) {
    Serial.println("ERROR: Invalid command length");
    return;
  }
  
  // Parse command format: "g01" = green tile at row 0, col 1
  char colorCode = command.charAt(0);
  int row = command.charAt(1) - '0';
  int col = command.charAt(2) - '0';
  
  // Validate row and col
  if (row < 0 || row >= NUM_ROWS || col < 0 || col >= NUM_COLS) {
    Serial.println("ERROR: Invalid tile position");
    return;
  }
  
  // Convert Unity [row,col] to Arduino tile index
  int tileIndex = row * NUM_COLS + col;
  
  // Convert color code to CRGB
  CRGB color;
  switch (colorCode) {
    case 'r':
    case 'R':
      color = colorRed;
      break;
    case 'g':
    case 'G':
      color = colorGreen;
      break;
    case 'b':
    case 'B':
      color = colorBlue;
      break;
    case 'y':
    case 'Y':
      color = colorYellow;
      break;
    case 'o':
    case 'O':
      color = colorOff;
      break;
    default:
      Serial.println("ERROR: Unknown color code");
      return;
  }
  
  // Set tile color
  setTileColor(tileIndex, color);
  
  // Debug output
  Serial.print("Set tile [");
  Serial.print(row);
  Serial.print(",");
  Serial.print(col);
  Serial.print("] (index ");
  Serial.print(tileIndex);
  Serial.print(") to ");
  Serial.println(colorCode);
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}

// ===================== UTILITY FUNCTIONS =====================
// Test function - cycles through all tiles with different colors
void testAllTiles() {
  CRGB testColors[] = {colorRed, colorGreen, colorBlue, colorYellow};
  
  for (int c = 0; c < 4; c++) {
    for (int i = 0; i < NUM_TILES; i++) {
      setTileColor(i, testColors[c]);
      FastLED.show();
      delay(200);
    }
  }
  
  // Return to red
  setAllTilesColor(colorRed);
  FastLED.show();
}

// Function to handle power supply protection
void checkPowerConsumption() {
  // Estimate current consumption
  // Each LED at full white draws ~60mA
  // Your 10A supply should handle this easily, but good to monitor
  
  int activeLEDs = 0;
  for (int i = 0; i < NUM_TILES; i++) {
    for (int j = 0; j < LEDS_PER_TILE; j++) {
      if (tiles[i][j].r > 0 || tiles[i][j].g > 0 || tiles[i][j].b > 0) {
        activeLEDs++;
      }
    }
  }
  
  // Estimated current in mA (rough calculation)
  float estimatedCurrent = (activeLEDs * 20); // Conservative estimate
  
  if (estimatedCurrent > 8000) { // 8A threshold
    Serial.println("WARNING: High power consumption detected");
    // Could implement auto-brightness reduction here
  }
}

// Startup animation
void startupAnimation() {
  // Rainbow sweep across all tiles
  for (int i = 0; i < NUM_TILES; i++) {
    CRGB color = CHSV(i * 30, 255, 255);
    setTileColor(i, color);
    FastLED.show();
    delay(150);
  }
  
  delay(500);
  
  // Fade to red
  setAllTilesColor(colorRed);
  FastLED.show();
}
