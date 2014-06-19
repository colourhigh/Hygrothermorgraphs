// basic js idea: 
/*
var state = false; 
setInterval(function(){ 
  state = !state;
  $.get('/ajax?output=' + (state ? 'on' : 'off')).done(function(data){ console.log(data.state); }); 
}, 1000);

*/

#include <SPI.h>
#include <Ethernet.h>
#define CHAR_MAX 100
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

int Pin3 = 3;
boolean Pin3ON = false;                  // Status flag
void setup() {
  pinMode(Pin3, OUTPUT);

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

void processRequest(char *request){
    if(s_match(request, "output=on") >0 ){
      digitalWrite(Pin3, HIGH);
      Serial.println("Pin 3 on!");
      Pin3ON = true;
    }
    if(s_match(request, "output=off") >0 ){ 
      digitalWrite(Pin3, LOW);
      Serial.println("Pin 3 off!");
      Pin3ON = false;
    }      
}

void sendBasePage(EthernetClient client){
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html");
    client.println("Connnection: close");
    client.println("");     // needed, for reasons    
    client.print("<!DOCTYPE HTML>");
    client.print("<html>");
    client.print("<head>");
    client.print("<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>");   

    client.print("<title>WebLightSwitch</title>");
    client.print("</head>");
    client.print("<body bgcolor='#303030'>");
    client.print("<style type='text/css'> .submit{width:230px; height:230px; text-indent: -99999px; text-align: center; background-color: Transparent; border:none;}</style>");
    client.print("<style type='text/css'> #switch{width:539px; height:248px;}</style>");
    client.print("<style type='text/css'> *{margin:auto; text-align:center;}</style>");
    client.print("<body><br><br><br><br><br><br>");
    //client.print("<div id='title'> <img src='https://dl.dropboxusercontent.com/u/155411/test/name_title.jpg' width='539' height='112' alt='Web Light Switch' /> </div> <br>");
    client.print("<div id='switch'>");
    client.print("<table width='539' height='248' border='0'> <tr>");
    client.print("<td width='265'><form method=get><input type=submit class='submit' name='output' value='off'></form></td>");
    client.print("<td width='264'><form method=get><input type=submit class='submit' name='output' value='on'></form></td></tr>");
    client.print("</table> </div>");
    client.print("<script src='http://code.jquery.com/jquery-1.11.1.min.js'></script>");
    client.print("</body>");
    client.print("</html>");
    if (Pin3ON) {
      client.print("<style type='text/css'>#switch{ background-image:url(https://dl.dropboxusercontent.com/u/155411/test/switch_on.jpg);}</style>");
    } 
    else {
      client.print("<style type='text/css'>#switch{ background-image:url(https://dl.dropboxusercontent.com/u/155411/test/switch_off.jpg);}</style>");
    }     
}

void sendAjaxPage(EthernetClient client){
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Connnection: close");
    client.println("");
    if (Pin3ON) {    
      client.println("{\"state\": \"on\"}");  
    }
    else{
      client.println("{\"state\": \"off\"}"); 
    }
}

void sendResponse(char* request, EthernetClient client){
  if(s_match(request, "/ajax") > 0){
       sendAjaxPage(client);
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



