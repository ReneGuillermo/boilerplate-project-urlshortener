require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns"); // Módulo nativo para resolver DNS
const url = require("url"); // Módulo nativo para parsear URLs

//-------------------------------------------
// 1. CONFIGURACIÓN BÁSICA
//-------------------------------------------
const port = process.env.PORT || 5000;
app.use(cors());

// Array global para simular la base de datos (almacenamiento en memoria)
const urlDatabase = [];
let shortUrlCounter = 1; // Contador para generar IDs cortos

// Middleware para servir archivos estáticos (CSS/JS)
app.use("/public", express.static(`${process.cwd()}/public`));

// Middleware de body-parser para manejar datos POST (URLs)
app.use(express.urlencoded({ extended: false }));

// Ruta principal para servir la página HTML
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// ------------------------------------------
// 2. ENDPOINT POST: ACORTAR URL
// ------------------------------------------
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url;

  // Validar el formato de la URL
  let parsedUrl;
  try {
    parsedUrl = new URL(originalUrl);
  } catch (e) {
    // Si la URL no tiene un formato válido (p.ej., no tiene http:// o https://)
    return res.json({ error: "invalid url" });
  }

  // Usar dns.lookup para verificar si el hostname existe (prueba #4). Tomamos el hostname (dominio.com) sin el protocolo.
  const hostname = parsedUrl.hostname;

  dns.lookup(hostname, (err) => {
    if (err) {
      // Si dns.lookup falla, el hostname es inválido o no existe.
      return res.json({ error: "invalid url" });
    }

    // Si la validación DNS es exitosa:
    // Buscar si la URL ya fue acortada para evitar duplicados
    const existingEntry = urlDatabase.find(
      (entry) => entry.original_url === originalUrl,
    );

    if (existingEntry) {
      // Si ya existe, devolvemos la entrada existente
      return res.json({
        original_url: existingEntry.original_url,
        short_url: existingEntry.short_url,
      });
    }

    // Crear la nueva entrada
    const newEntry = {
      original_url: originalUrl,
      short_url: shortUrlCounter,
    };

    urlDatabase.push(newEntry);
    shortUrlCounter++; // Incrementamos el contador para la próxima URL

    // Devolver la respuesta JSON (prueba #2)
    res.json({
      original_url: newEntry.original_url,
      short_url: newEntry.short_url,
    });
  });
});

// ------------------------------------------
// 3. ENDPOINT GET: REDIRIGIR URL
// ------------------------------------------
app.get("/api/shorturl/:short_url", function (req, res) {
  const shortUrlId = parseInt(req.params.short_url);

  // Buscar el ID corto en el almacenamiento
  const urlEntry = urlDatabase.find((entry) => entry.short_url === shortUrlId);

  if (urlEntry) {
    // Si se encuentra, redirigir a la URL original (prueba #3)
    res.redirect(urlEntry.original_url);
  } else {
    // Si no se encuentra el ID
    res.json({ error: "No short URL found for the given input" });
  }
});

//--------------------------------------------
// 4. INICIAR EL SERVIDOR
//--------------------------------------------
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

