#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

// =============================================================================
// PIN CONFIGURATION (AS REQUESTED)
// =============================================================================
const int PIN_EMG = 34;
const int PIN_ECHO = 18;
const int PIN_TRIG = 5;
const int PIN_SERVO = 13;
const int PIN_LED = 2;
const int PIN_BUZZER = 4; // Moved from GPIO 2 to prevent boot issues
const int PIN_ENA = 14;
const int PIN_ENB = 15;
const int PIN_IN1 = 27;
const int PIN_IN2 = 26;
const int PIN_IN3 = 25;
const int PIN_IN4 = 33;
const int PIN_GPS_RX = 16;
const int PIN_GPS_TX = 17;
const int PIN_BATTERY = 35; // Future

// =============================================================================
// SYSTEM CONFIGURATION
// =============================================================================
const char* AP_SSID = "MOVI-X";
const char* AP_PASS = "movix1234";

const int PWM_FREQ = 5000;
const int PWM_RES = 8;
const int PWM_CH_ENA = 0;
const int PWM_CH_ENB = 1;
const int PWM_CH_SERVO = 2;

// Safety & Thresholds
const unsigned long WATCHDOG_TIMEOUT_MS = 10000; // Increased to 10s to prevent false alarms
int maxSpeedLimit = 70; // 0-100%
int obstacleThresholdCm = 20;

// =============================================================================
// STATE & TELEMETRY
// =============================================================================
enum WheelchairMode {
  MODE_IDLE,
  MODE_MANUAL,
  MODE_VOICE,
  MODE_EMG,
  MODE_AUTONOMOUS,
  MODE_OBSTACLE_AVOIDANCE,
  MODE_EMERGENCY
};

enum MovementState {
  MOVE_STOP,
  MOVE_FORWARD,
  MOVE_BACKWARD,
  MOVE_LEFT,
  MOVE_RIGHT
};

struct SystemState {
  WheelchairMode currentMode = MODE_IDLE;
  MovementState currentMovement = MOVE_STOP;
  unsigned long lastHeartbeat = 0;
  bool emergencyStop = false;
  
  // Telemetry
  int distanceCm = 0;
  int emgValue = 0;
  float latitude = 0.0;
  float longitude = 0.0;
  int batteryPercent = 85; // Mock for now
  bool obstacleDetected = false;
  int servoAngle = 90;
  int currentSpeed = 0; // PWM 0-255
  int targetSpeed = 0;
} state;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

TaskHandle_t taskTelemetryHandle;
TaskHandle_t taskMotorHandle;
TaskHandle_t taskSafetyHandle;

// =============================================================================
// HARDWARE CONTROL
// =============================================================================

void setupMotors() {
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  
  ledcAttach(PIN_ENA, PWM_FREQ, PWM_RES);
  ledcAttach(PIN_ENB, PWM_FREQ, PWM_RES);
  
  ledcWrite(PIN_ENA, 0);
  ledcWrite(PIN_ENB, 0);
}

void setMotorPins(int in1, int in2, int in3, int in4) {
  digitalWrite(PIN_IN1, in1);
  digitalWrite(PIN_IN2, in2);
  digitalWrite(PIN_IN3, in3);
  digitalWrite(PIN_IN4, in4);
}

void stopMotorsImmediate() {
  state.targetSpeed = 0;
  state.currentSpeed = 0;
  state.currentMovement = MOVE_STOP;
  ledcWrite(PIN_ENA, 0);
  ledcWrite(PIN_ENB, 0);
  setMotorPins(0, 0, 0, 0);
}

// =============================================================================
// FREERTOS TASKS
// =============================================================================

void taskMotorControl(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(20); // 50Hz update rate
  
  while(true) {
    // 1. Safety overrides
    if (state.emergencyStop || state.currentMode == MODE_EMERGENCY || state.obstacleDetected) {
      stopMotorsImmediate();
    } 
    else {
      // 2. Smooth acceleration (Ramping)
      if (state.currentSpeed < state.targetSpeed) {
        state.currentSpeed += 10; // Accel step
        if (state.currentSpeed > state.targetSpeed) state.currentSpeed = state.targetSpeed;
      } else if (state.currentSpeed > state.targetSpeed) {
        state.currentSpeed -= 20; // Decel step (faster than accel)
        if (state.currentSpeed < state.targetSpeed) state.currentSpeed = state.targetSpeed;
      }
      
      // Calculate max allowed PWM based on percentage
      int maxAllowedPwm = (255 * maxSpeedLimit) / 100;
      int activePwm = min(state.currentSpeed, maxAllowedPwm);
      
      // 3. Direction control
      if (activePwm == 0 && state.targetSpeed == 0) {
        setMotorPins(0, 0, 0, 0);
      } else {
        switch(state.currentMovement) {
          case MOVE_FORWARD:  setMotorPins(1, 0, 1, 0); break;
          case MOVE_BACKWARD: setMotorPins(0, 1, 0, 1); break;
          case MOVE_LEFT:     setMotorPins(0, 1, 1, 0); break; // Tank turn
          case MOVE_RIGHT:    setMotorPins(1, 0, 0, 1); break; // Tank turn
          case MOVE_STOP:     setMotorPins(0, 0, 0, 0); activePwm = 0; break;
        }
      }
      
      // 4. Apply PWM
      ledcWrite(PIN_ENA, activePwm);
      ledcWrite(PIN_ENB, activePwm);
    }
    
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// Buzzer helper (Many Arduino buzzer modules are Active-Low, meaning LOW = ON)
// If your buzzer screams as soon as you turn it on, flip these!
#define BUZZER_ON LOW
#define BUZZER_OFF HIGH

void setBuzzer(bool on) {
  digitalWrite(PIN_BUZZER, on ? BUZZER_ON : BUZZER_OFF);
}

void taskSafety(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(100); // 10Hz
  
  while(true) {
    // 1. Watchdog: DISABLED for now — re-enable after controls are tested
    // if (millis() > 15000 && ws.count() > 0 && 
    //     millis() - state.lastHeartbeat > WATCHDOG_TIMEOUT_MS) {
    //   if (!state.emergencyStop) {
    //     state.emergencyStop = true;
    //     state.currentMode = MODE_EMERGENCY;
    //     Serial.println("WATCHDOG: App disconnected, emergency stop.");
    //     setBuzzer(true);
    //   }
    // }
    
    // 2. Ultrasonic reading
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);
    
    long duration = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout (~5m)
    if (duration > 0) {
      state.distanceCm = duration * 0.034 / 2;
    } else {
      state.distanceCm = 999;
    }
    
    // 3. Obstacle avoidance logic (buzzer DISABLED for testing)
    if (state.distanceCm > 0 && state.distanceCm < obstacleThresholdCm) {
      if (!state.obstacleDetected && state.currentMovement == MOVE_FORWARD) {
        state.obstacleDetected = true;
        Serial.printf("OBSTACLE: Stopped at %d cm\n", state.distanceCm);
        // Buzzer disabled for now:
        // setBuzzer(true);
        // vTaskDelay(pdMS_TO_TICKS(100));
        // setBuzzer(false);
      }
    } else {
      state.obstacleDetected = false;
    }
    
    // 4. Read EMG (dummy filter for now)
    state.emgValue = analogRead(PIN_EMG);
    
    // Force buzzer OFF every cycle to prevent any stuck state
    setBuzzer(false);
    
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

void taskTelemetry(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();
  const TickType_t xFrequency = pdMS_TO_TICKS(100); // 10Hz
  
  while(true) {
    if (ws.count() > 0) {
      StaticJsonDocument<512> doc;
      doc["distance"] = state.distanceCm;
      
      switch(state.currentMode) {
        case MODE_IDLE: doc["mode"] = "IDLE"; break;
        case MODE_MANUAL: doc["mode"] = "MANUAL"; break;
        case MODE_VOICE: doc["mode"] = "VOICE"; break;
        case MODE_EMG: doc["mode"] = "EMG"; break;
        case MODE_EMERGENCY: doc["mode"] = "EMERGENCY"; break;
        default: doc["mode"] = "UNKNOWN"; break;
      }
      
      switch(state.currentMovement) {
        case MOVE_STOP: doc["movement"] = "STOP"; break;
        case MOVE_FORWARD: doc["movement"] = "FORWARD"; break;
        case MOVE_BACKWARD: doc["movement"] = "BACKWARD"; break;
        case MOVE_LEFT: doc["movement"] = "LEFT"; break;
        case MOVE_RIGHT: doc["movement"] = "RIGHT"; break;
      }
      
      doc["emg"] = state.emgValue;
      doc["latitude"] = state.latitude;
      doc["longitude"] = state.longitude;
      doc["battery"] = state.batteryPercent;
      doc["connection"] = true;
      doc["obstacle"] = state.obstacleDetected;
      doc["emergency"] = state.emergencyStop;
      doc["wifi_clients"] = WiFi.softAPgetStationNum();
      doc["uptime"] = millis();
      doc["signal_strength"] = -45; // Mock AP signal for client
      doc["speed"] = maxSpeedLimit;
      doc["servo_angle"] = state.servoAngle;
      doc["timestamp"] = millis();
      
      String jsonString;
      serializeJson(doc, jsonString);
      ws.textAll(jsonString);
    }
    
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}

// =============================================================================
// WEB SERVER HANDLERS
// =============================================================================

void handleMovement(AsyncWebServerRequest *request) {
  String path = request->url();
  state.lastHeartbeat = millis(); // Any command acts as heartbeat
  
  // Stop is ALWAYS allowed — no safety check can block it
  if (path.endsWith("stop")) {
    state.currentMovement = MOVE_STOP;
    state.targetSpeed = 0;
    request->send(200, "application/json", "{\"success\":true,\"action\":\"STOP\"}");
    return;
  }
  
  // Emergency stop blocks all other movement
  if (state.emergencyStop) {
    request->send(403, "application/json", "{\"success\":false,\"error\":\"Emergency stop active\"}");
    return;
  }
  
  // Obstacle only blocks forward — reverse/turn always allowed
  if (state.obstacleDetected && path.endsWith("forward")) {
    request->send(403, "application/json", "{\"success\":false,\"error\":\"Obstacle detected\"}");
    return;
  }
  
  if (path.endsWith("forward")) {
    state.currentMovement = MOVE_FORWARD;
    state.targetSpeed = 255;
  } else if (path.endsWith("backward")) {
    state.currentMovement = MOVE_BACKWARD;
    state.targetSpeed = 255;
  } else if (path.endsWith("left")) {
    state.currentMovement = MOVE_LEFT;
    state.targetSpeed = 200; // Slower turns
  } else if (path.endsWith("right")) {
    state.currentMovement = MOVE_RIGHT;
    state.targetSpeed = 200;
  } else if (path.endsWith("stop")) {
    state.currentMovement = MOVE_STOP;
    state.targetSpeed = 0;
  } else {
    request->send(400, "application/json", "{\"success\":false,\"error\":\"Invalid direction\"}");
    return;
  }
  
  StaticJsonDocument<200> doc;
  doc["success"] = true;
  doc["action"] = (state.currentMovement == MOVE_STOP) ? "STOP" : 
                  (state.currentMovement == MOVE_FORWARD) ? "FORWARD" :
                  (state.currentMovement == MOVE_BACKWARD) ? "BACKWARD" :
                  (state.currentMovement == MOVE_LEFT) ? "LEFT" : "RIGHT";
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  request->send(200, "application/json", response);
}

void handleMode(AsyncWebServerRequest *request) {
  String path = request->url();
  state.lastHeartbeat = millis(); // Any mode change acts as a heartbeat
  
  if (path.endsWith("emergency")) {
    state.emergencyStop = true;
    state.currentMode = MODE_EMERGENCY;
    stopMotorsImmediate();
    setBuzzer(true);
    request->send(200, "application/json", "{\"success\":true,\"action\":\"EMERGENCY\"}");
    return;
  }
  
  // Can't change mode if in emergency unless explicitly resetting
  if (state.emergencyStop && !path.endsWith("manual")) {
    request->send(403, "application/json", "{\"success\":false,\"error\":\"Emergency active\"}");
    return;
  }
  
  if (path.endsWith("manual")) {
    state.currentMode = MODE_MANUAL;
    state.emergencyStop = false; // Reset emergency
    setBuzzer(false);
  } else if (path.endsWith("voice")) {
    state.currentMode = MODE_VOICE;
  } else if (path.endsWith("emg")) {
    state.currentMode = MODE_EMG;
  }
  
  request->send(200, "application/json", "{\"success\":true}");
}

// =============================================================================
// SETUP & LOOP
// =============================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- MOVI-X Smart Wheelchair Booting ---");

  // Init Pins
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  
  setBuzzer(false);
  digitalWrite(PIN_LED, LOW);
  
  setupMotors();
  
  // Setup WiFi AP - Robust configuration
  WiFi.mode(WIFI_AP);
  
  // Explicitly configure IP to ensure it's 192.168.4.1
  IPAddress local_ip(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  
  if (!WiFi.softAP(AP_SSID, AP_PASS, 1, 0, 4)) { // SSID, PASS, Channel 1, Hidden 0, Max connections 4
    Serial.println("Soft AP failed to start!");
  }
  
  delay(500); // Give WiFi hardware time to initialize
  
  Serial.print("AP IP address: ");
  Serial.println(WiFi.softAPIP());
  
  // Setup Server endpoints
  server.on("/api/v1/heartbeat", HTTP_POST, [](AsyncWebServerRequest *request){
    state.lastHeartbeat = millis();
    request->send(200, "application/json", "{\"success\":true}");
  });
  
  server.on("/api/v1/movement/forward", HTTP_POST, handleMovement);
  server.on("/api/v1/movement/backward", HTTP_POST, handleMovement);
  server.on("/api/v1/movement/left", HTTP_POST, handleMovement);
  server.on("/api/v1/movement/right", HTTP_POST, handleMovement);
  server.on("/api/v1/movement/stop", HTTP_POST, handleMovement);
  
  server.on("/api/v1/mode/manual", HTTP_POST, handleMode);
  server.on("/api/v1/mode/voice", HTTP_POST, handleMode);
  server.on("/api/v1/mode/emg", HTTP_POST, handleMode);
  server.on("/api/v1/mode/emergency", HTTP_POST, handleMode);
  server.on("/api/v1/speed", HTTP_POST, [](AsyncWebServerRequest *request){
    // In AsyncWebServer body parsing requires the body handler, this is a simplification
    // assuming speed is passed as a query param for now, or use defaults.
    if(request->hasParam("val")) {
      maxSpeedLimit = request->getParam("val")->value().toInt();
      maxSpeedLimit = constrain(maxSpeedLimit, 0, 100);
    }
    request->send(200, "application/json", "{\"success\":true}");
  });
  
  server.on("/api/v1/status", HTTP_GET, [](AsyncWebServerRequest *request){
    state.lastHeartbeat = millis(); // Acts as heartbeat too
    request->send(200, "application/json", "{\"success\":true}"); // Simplified, full data is on WS
  });
  
  // Add CORS headers for web app dev server testing
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");
  
  // Handle OPTIONS (CORS preflight)
  server.onNotFound([](AsyncWebServerRequest *request) {
    if (request->method() == HTTP_OPTIONS) {
      request->send(200);
    } else {
      request->send(404);
    }
  });

  // WebSocket event handler — reset heartbeat when client connects
  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client,
                AwsEventType type, void *arg, uint8_t *data, size_t len) {
    if (type == WS_EVT_CONNECT) {
      state.lastHeartbeat = millis(); // Reset watchdog on new connection
      Serial.printf("WebSocket client #%u connected\n", client->id());
    } else if (type == WS_EVT_DISCONNECT) {
      Serial.printf("WebSocket client #%u disconnected\n", client->id());
    }
  });
  
  // Attach WebSocket
  server.addHandler(&ws);
  server.begin();
  
  Serial.println("Server and WebSocket running.");
  
  state.lastHeartbeat = millis();
  
  // Create FreeRTOS Tasks
  xTaskCreatePinnedToCore(
    taskMotorControl, "MotorControl", 4096, NULL, 2, &taskMotorHandle, 1
  );
  
  xTaskCreatePinnedToCore(
    taskSafety, "Safety", 4096, NULL, 3, &taskSafetyHandle, 1
  );
  
  xTaskCreatePinnedToCore(
    taskTelemetry, "Telemetry", 4096, NULL, 1, &taskTelemetryHandle, 0
  );
  
  digitalWrite(PIN_LED, HIGH); // System ready
  Serial.println("System Ready.");
}

void loop() {
  // Empty. Everything is in FreeRTOS tasks.
  vTaskDelete(NULL);
}
