#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "router name"; 
const char* password = "router password";
const char* mqttServer = "host name";
const int mqttPort = "host port";
const char* mqttUser = "host user";
const char* mqttPassword = "host password";

String message;

//pines que tienen conectados las leds
int rPin = 14;
int gPin = 12;
int bPin = 13; 

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {

  Serial.begin(115200);

  pinMode(rPin,OUTPUT);
  pinMode(gPin,OUTPUT);
  pinMode(bPin,OUTPUT);

  //----conectando a WiFi----
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.println("Connecting to WiFi...");
  }
  
  Serial.println("Connected to the WiFi network");
  //-------------------------

  //----Conectando a MQTT----
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);

  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    if (client.connect("ESP8266Client", mqttUser, mqttPassword )) {
      Serial.println("connected"); 
    } else {
      Serial.print("failed with state ");
      Serial.print(client.state());
      delay(2000);
    }
  }
  //-------------------------

  client.subscribe("led/rgb");
  client.publish("led/rgb", "hello :D, RGB connected");
 
}

void callback(char* topic, byte* payload, unsigned int length) {

  message = "";
  
  //Serial.print("Message arrived in topic: ");
  Serial.println(topic);
 
  //Serial.print("Message:");
  for (int i = 0; i < length; i++) {
    message = message + (char)payload[i];
  }

  //transformar el mensaje a JSON.
  DynamicJsonDocument doc(1024);
  
  deserializeJson(doc, message);

  int r = doc["r"];
  int g = doc["g"];
  int b = doc["b"];

  //mandar los colores a las leds
  analogWrite(rPin, r);
  analogWrite(gPin, g);
  analogWrite(bPin, b);
  
  Serial.println(r);
  Serial.println(g);
  Serial.println(b);
   
}

void loop() {
  client.loop();
}
