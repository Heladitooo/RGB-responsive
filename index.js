const mqtt = require("mqtt");
const getColors = require("get-image-colors");
const screenshot = require("screenshot-desktop");
const Jimp = require("jimp");
const path = require("path");

//crea el cliente mqtt que se conectara a nuestro ESP8266.
const client = mqtt.connect({
  host: "host ip",
  port: "host port",
  username: "host username",
  password: "host password",
});

//se intentara conectar al tema led/rgb.
client.on("connect", function () {
  client.subscribe("led/rgb", function (err) {
    if (!err) {
      console.log("conected to led/rgb");
    }
  });
});

//lo que aumentara al dominante.
let more = 100;

//ayuda a un cambio no tan brusco.
let changeColor = [];

//inicia el intervalo que se ejecuta cada segundo.
setInterval(async () => {

  //toma el screenshot a la pantalla.
  screenshot({
    format: "png",
    filename: "./screenshot/screenshot.png",
  }).then(() => {

    //lo baja a 25x25 pixeles.
    Jimp.read("./screenshot/screenshot.png")
      .then((image) => {
        return image.resize(25, 25).write("./screenshot/screenshotM.png");
      })
      .then(() => {

        //obtiene 1 color predominante.
        getColors(path.join("./screenshot", "screenshotM.png"), {
          count: 1,
          type: "image/png",
        })
          .then((colors) => {

            //.calcula el dominante de el RGB.
            let maxColor = Math.max(
              colors[0]._rgb[0],
              colors[0]._rgb[1],
              colors[0]._rgb[2]
            );

            //lo aumenta.
            for (let i = 0; i < 3; i++) {
              if (colors[0]._rgb[i] === maxColor) {
                colors[0]._rgb[i] += more;
              }
            }
            

            //aqui crea un ciclo para que cambie de que no cambie de color de una forma brusca.
            if (changeColor.length > 0) {
              while (
                changeColor[0] != colors[0]._rgb[0] &&
                changeColor[1] != colors[0]._rgb[1] &&
                changeColor[2] != colors[0]._rgb[2]
              ) {
                //R
                if (changeColor[0] != colors[0]._rgb[0]) {
                  if (changeColor[0] < colors[0]._rgb[0]) {
                    changeColor[0]++;
                  } else {
                    changeColor[0]--;
                  }
                }
                //G
                if (changeColor[1] != colors[0]._rgb[1]) {
                  if (changeColor[1] < colors[0]._rgb[1]) {
                    changeColor[1]++;
                  } else {
                    changeColor[1]--;
                  }
                }
                //B
                if (changeColor[2] != colors[0]._rgb[2]) {
                  if (changeColor[2] < colors[0]._rgb[2]) {
                    changeColor[2]++;
                  } else {
                    changeColor[2]--;
                  }
                }

                //publicara en el tema led/rgb en formato JSON.
                client.publish(
                  "led/rgb",
                  JSON.stringify({
                    r: changeColor[0],
                    g: changeColor[1],
                    b: changeColor[2],
                  })
                );
              }
            } else {

              //publicara por primera vez en el tema led/rgb en formato JSON.
              client.publish(
                "led/rgb",
                JSON.stringify({
                  r: colors[0]._rgb[0],
                  g: colors[0]._rgb[1],
                  b: colors[0]._rgb[2],
                })
              );
            }

            console.log(changeColor);
            changeColor = colors[0]._rgb;

          })
          .catch((error) => {
            console.log("fail...");
          });
      });
  });
}, 1000);
