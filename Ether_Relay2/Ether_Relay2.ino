

#include <SPI.h>
#include <Ethernet.h>
#include "Wire.h"
#define CHAR_MAX 100
#define I2C_ADDR  0x20  // 0x20 is the address with all jumpers removed

// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network:
byte mac[] = {
  0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
byte ip[]  = {
  10, 1, 1, 125 };
byte gateway[] = {
  10, 1, 1, 1 };
byte subnet[]  = {
  255, 255, 255, 0 };

// Initialize the Ethernet server library
// with the IP address and port you want to use
// (port 80 is default for HTTP):
EthernetServer server(80);

int S1 = 1;
int S2 = 4;
int S3 = 16;


int Pin2 = 2;
char temperature[8];

boolean RELAYSTATE = 0;                  // Status flag
void setup() {


  // Open serial communications and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for Leonardo only
  }

  // start the Ethernet connection and the server:
  Ethernet.begin(mac, ip/*, gateway, subnet*/);
  server.begin();
  Serial.print("server is at ");
  Serial.println(Ethernet.localIP());
  Serial.println("initialization done.");

  digitalWrite(Pin2, LOW);
  pinMode(Pin2, INPUT);
  pinMode(15, INPUT);

  Wire.begin(); // Wake up I2C bus
  // Set I/O bank A to outputs
  Wire.beginTransmission(I2C_ADDR);
  Wire.write(0x00); // IODIRA register
  Wire.write(0x00); // Set all of bank A to outputs
  Wire.endTransmission();
}

int s_cmp(const char *a, const char *b)
{
        char c1 = 0, c2 = 0;
        while (c1 == c2) {
                c1 = *(a++);
                if ('\0' == (c2 = *(b++)))
                        return c1 == '\0' ? -1 : 1;
        }
        return 0;
}


int s_match(const char *a, const char *b){
        int i = 0, count = 0;
        while (a[i] != '\0') {
                switch (s_cmp(a + i, b)) {
                case -1:
                        return ++count;
                case 1:
                        ++count;
                        break;
                }
                i++;
        }
        return count;
}


void OneWireReset (int Pin) // reset.  Should improve to act as a presence pulse
{
  digitalWrite (Pin, LOW);
  pinMode (Pin, OUTPUT);        // bring low for 500 us
  delayMicroseconds (500);
  pinMode (Pin, INPUT);
  delayMicroseconds (500);
}

void OneWireOutByte (int Pin, byte d) // output byte d (least sig bit first).
{
  byte n;

  for (n=8; n!=0; n--)
  {
    if ((d & 0x01) == 1)  // test least sig bit
    {
      digitalWrite (Pin, LOW);
      pinMode (Pin, OUTPUT);
      delayMicroseconds (5);
      pinMode (Pin, INPUT);
      delayMicroseconds (60);
    }
    else
    {
      digitalWrite (Pin, LOW);
      pinMode (Pin, OUTPUT);
      delayMicroseconds (60);
      pinMode (Pin, INPUT);
    }

    d = d>>1; // now the next bit is in the least sig bit position.
  }
}

byte OneWireInByte (int Pin) // read byte, least sig byte first
{
  byte d, n, b;

  for (n=0; n<8; n++)
  {
    digitalWrite (Pin, LOW);
    pinMode (Pin, OUTPUT);
    delayMicroseconds (5);
    pinMode (Pin, INPUT);
    delayMicroseconds (5);
    b = digitalRead (Pin);
    delayMicroseconds (50);
    d = (d >> 1) | (b<<7); // shift d to right and insert b in most sig bit position
  }
  return (d);
}

void getCurrentTemp (char *temp)
{
  int HighByte, LowByte, TReading, Tc_100, sign, whole, fract;
  int pos = 0;
  OneWireReset (Pin2);
  OneWireOutByte (Pin2, 0xcc);
  OneWireOutByte (Pin2, 0x44); // perform temperature conversion, strong pullup for one sec

  OneWireReset (Pin2);
  OneWireOutByte (Pin2, 0xcc);
  OneWireOutByte (Pin2, 0xbe);

  LowByte = OneWireInByte (Pin2);
  HighByte = OneWireInByte (Pin2);
  TReading = (HighByte << 8) + LowByte;
  sign = TReading & 0x8000;  // test most sig bit
  if (sign) // negative
  {
    TReading = (TReading ^ 0xffff) + 1; // 2's comp
  }
  Tc_100 = (6 * TReading) + TReading / 4;    // multiply by (100 * 0.0625) or 6.25

  whole = Tc_100 / 100;  // separate off the whole and fractional portions
  fract = Tc_100 % 100;

  if (sign) {
    temp[pos++] = '-';
  } else {
    temp[pos++] = '+';
  }

  if (whole/100 != 0) {
    temp[pos++] = whole/100+'0';
  }

  temp[pos++] = (whole-(whole/100)*100)/10 +'0' ;
  temp[pos++] = whole-(whole/10)*10 +'0';
  temp[pos++] = '.';
  temp[pos++] = fract/10 +'0';
  temp[pos++] = fract-(fract/10)*10 +'0';
  temp[pos++] = '\0';
}

int getOutputIndex(char * request){
    int s = S1;
    if(s_match(request, "s=2") >0 ){
      s = S2;
    }
    if(s_match(request, "s=3") >0 ){
      s = S3;
    }
    return s;
}


void processRequest(char *request){
    int s = getOutputIndex(request);
    if(s_match(request, "heat=on") >0 ){
        RELAYSTATE |= s;
        RELAYSTATE &= ~(s<<1);
    }
    if(s_match(request, "heat=off") >0 ){
      RELAYSTATE &= ~s;
    }
    if(s_match(request, "cool=on") >0 ){
        RELAYSTATE |= (s<<1);
        RELAYSTATE &= ~s;
    }
    if(s_match(request, "cool=off") >0 ){
      RELAYSTATE &= ~(s<<1);
    }
    Wire.beginTransmission(I2C_ADDR);
    Wire.write(0x12);        // Select GPIOA
    Wire.write(RELAYSTATE);  // Send value to bank A
    Wire.endTransmission();
    //digitalWrite(RELAY, RELAYSTATE);
}

void sendBasePage(EthernetClient client){
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println("Connnection: close");
    client.println("");     // needed, for reasons
    client.println("<!DOCTYPE HTML>");
    client.println("<html>");
    client.println("<head>");
    client.println("<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>");
    client.println("<script src='http://code.jquery.com/jquery-1.11.1.min.js'></script>");
    client.println("<script src='http://localhost:8000/main.js'></script>");
    client.println("<title>Hygrothermograph</title>");
    client.println("</head>");
    client.println("<body>");
    client.println("<div id='main'></div>");
    client.println("</body>");
    client.println("</html>");
}

void sendAjaxPage(EthernetClient client, int s){
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Access-Control-Allow-Origin: *");
    client.println("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, PATCH, DELETE");
    client.println("Access-Control-Allow-Headers: X-Requested-With,content-type");
    client.println("Connnection: close");
    client.println("");
    getCurrentTemp(temperature);
    Serial.println(temperature);
    client.print("{\"state\":{\"heat\":\"");
    if (RELAYSTATE & s) {
       client.print("on\"");
    }
    else{
      client.print("off\"");
    }
    client.print(",\"cool\":\"");
    if (RELAYSTATE & (s<<2)) {
       client.print("on\"");
    }
    else{
      client.print("off\"");
    }
    client.print(",\"temperature\":\"");
    client.print(temperature);
    client.print("\"}}");
}

void sendResponse(char* request, EthernetClient client){
  if(s_match(request, "/ajax") > 0){
       sendAjaxPage(client, getOutputIndex(request));
   }
   else{
      sendBasePage(client);
   }

}


void loop() {
  EthernetClient client = server.available();
  if (client) {
    char request[CHAR_MAX];
    int pos = 0;
    Serial.println("new client");
    boolean finished = false;
    while (client.connected() && !finished) {
      if (client.available()) {
        char c = client.read();
        Serial.write(c);
        if(pos < CHAR_MAX -1){
           request[pos++] = c;
        }
        if (c == '\n') {
          request[pos] = '\0';
          Serial.println("Input read");
          Serial.println(request);
          processRequest(request);
          sendResponse(request, client);
          finished = true;
        }
      }
    }
    pos = 0;
    delay(1);
    client.stop();
    Serial.println("client disconnected");
  }
}



