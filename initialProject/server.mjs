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
  const sendResponse = (statusCode, contentType, data) => {
    console.log(new Date().toISOString(), request.url, statusCode);
    response.setHeader('Content-Type', contentType);
    response.writeHead(statusCode);
    response.end(data);
  };

  try {
    const parsedUrl = url.parse(request.url, true);
    let pathName = parsedUrl.pathname;
    if (!pathName || pathName == '/') pathName = '/index.html';

    // API endpoints
    if (pathName == '/api/state') {
      const data = {
        TIME: new Date().toISOString(),
        STAGE: process.env.STAGE || '-',
        SERVER_TITLE: process.env.SERVER_TITLE || 'Title',
        TEMPLATE_VERSION: process.env.TEMPLATE_VERSION || 'v0.0.0',
        PROJECT_VERSION: process.env.PROJECT_VERSION || 'v0.0.0',
      };
      return sendResponse(200, 'application/json', JSON.stringify(data, null, 2));
    }

    if (pathName == '/api/status') {
      const data = {
        diploiStatusVersion: 1,
        items: [
          {
            identifier: 'tinyservice',
            description: 'Server status',
            name: 'Tiny Server',
            status: 'green',
          },
        ],
      };
      return sendResponse(200, 'application/json', JSON.stringify(data, null, 2));
    }

    // Static files
    fs.readFile(`${baseDir}${pathName}`, (error, data) => {
      if (!error) {
        return sendResponse(200, getContentType(pathName), data);
      } else {
        if (error.errno != -2) console.log('Error 404', error);
        return sendResponse(404, 'text/plain', '404 - File Not Found');
      }
    });
  } catch (error) {
    try {
      console.log('Error 500', error);
      sendResponse(505, 'text/plain', '500 - Internal Server Error');
    } catch (e) {
      console.log('Error2 500', error, e);
      console.log(new Date().toISOString(), request.url, 500);
    }
  }
});

// Start server
httpServer.listen(port, () => {
  console.log(`🌍 Server is running at http://${host}:${port}`);
});
