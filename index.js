var Canvas = require('canvas');
var express = require('express');
var Image = Canvas.Image;
var fs = require('fs');

var PORT = 19999;
var app = express();


app.get('/tiles/:z/:x/:y', function (req, res) {
  var x = req.params.x,
      y = req.params.y,
      z = req.params.z;
  console.log('make tile: ', x, y, z);
  res.type('image/png').send(generateTile(x,y,z));
});

app.listen(PORT, function () {
  console.log('Tile server is listening on port ' + PORT);
});

function generateTile(x,y,z) {

  var canvas = new Canvas(256, 256);
  var ctx = canvas.getContext('2d');

  var coords = '(' + [x, y].join(', ') + ')';
  ctx.rect(0, 0, 256, 256);
  ctx.fillStyle = '#F0F0F0';
  ctx.fill();
  ctx.fillStyle = '#777';
  ctx.font = '16px Arial';
  ctx.fillText(coords, 24, 64);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(0, 0, 256, 256);
  ctx.fillStyle = '#DDD';
  ctx.font = '64px Arial';
  ctx.fillText(z + 'x', 64, 192);
  var bytes = canvas.toBuffer(undefined, 3, canvas.PNG_FILTER_NONE);
  return bytes;
}
