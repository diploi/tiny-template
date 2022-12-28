import http from 'http';
import url from 'url';
import fs from 'fs';

// Configuration
const port = 80;
const host = '127.0.0.1';
const baseDir = process.cwd() + '/pages';

// Mime Types
const mimeTypes = {
  html: 'text/html',
  jgp: 'image/jpeg',
  css: 'text/css',
  js: 'text/javascript',
  png: 'image/png',
  ico: 'image/x-icon',
  json: 'application/json',
};

// Get the content type for a given path
const getContentType = (pathName) => {
  const m = pathName.match(/\.([0-9a-z]+)$/i);
  return m && mimeTypes[m[1]] ? mimeTypes[m[1]] : 'application/octet-stream';
};

// Request handler
const httpServer = http.createServer((request, response) => {
  try {
    const parsedUrl = url.parse(request.url, true);
    let pathName = parsedUrl.pathname;
    if (!pathName || pathName == '/') pathName = '/index.html';

    // API endpoints

    if (pathName == '/api/state') {
      response.setHeader('Content-Type', 'application/json');
      response.writeHead(404);
      response.end(
        JSON.stringify(
          {
            TIME: new Date().toISOString(),
            STAGE: process.env.STAGE || '-',
            SERVER_TITLE: process.env.SERVER_TITLE || 'Title',
            TEMPLATE_VERSION: 'v0.0.0', // TODO: Make core send this to k8s => template
            PROJECT_VERSION: 'v0.0.0', // TODO: Make core send this to k8s => build => env
          },
          null,
          2
        )
      );
      return;
    }

    if (pathName == '/api/status') {
      response.setHeader('Content-Type', 'application/json');
      response.writeHead(404);
      response.end(
        JSON.stringify(
          {
            diploiStatusVersion: 1,
            items: [
              {
                identifier: 'tinyservice',
                description: 'Server status',
                name: 'Tiny Server',
                status: 'green',
              },
            ],
          },
          null,
          2
        )
      );
      return;
    }

    // Static files
    fs.readFile(`${baseDir}${pathName}`, (error, data) => {
      if (!error) {
        response.setHeader('Content-Type', getContentType(pathName));
        console.log(new Date().toISOString(), request.url, 200);
        response.writeHead(200);
        response.end(data);
      } else {
        console.log(new Date().toISOString(), request.url, 404);
        if (error.errno != -2) console.log('Error 404', error);
        response.setHeader('Content-Type', 'text/plain');
        response.writeHead(404);
        response.end('404 - File Not Found');
      }
    });
  } catch (error) {
    try {
      response.setHeader('Content-Type', 'text/plain');
      response.writeHead(500);
      response.end('500 - Internal Server Error');
    } catch (e) {}
    console.log('Error 500', error);

    console.log(new Date().toISOString(), request.url, 500);
  }
});

// Start server
httpServer.listen(port, () => {
  console.log(`🌍 Server is running at http://${host}:${port}`);
});
