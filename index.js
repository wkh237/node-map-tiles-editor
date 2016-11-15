var express = require('express');
var Canvas = require('canvas');
var Image = Canvas.Image;
var app = express();
var moment = require('moment');

var regions = JSON.parse(require('fs').readFileSync('./regions.json'));

app.set('port', (process.env.PORT || 5000));

app.use('/public', express.static('public'));
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

app.get('/tiles/:z/:x/:y', function (req, res) {
  var x = req.params.x,
      y = req.params.y,
      z = req.params.z;
  console.log('make tile: ', x, y, z);
  res.type('image/png').send(generateTile(x,y,z));
});

app.get('/exps/:id', function(req, res) {
  res.send(dummyExperience(req.params.id));
});

app.get('/pins', function(req, res) {
  res.send(regions.pins);
});

app.get('/pins/:id', function(req, res) {
  res.send(pins[req.params.id]);
});

function dummyExperience(id) {
  var type = Math.random() > 0.8 ? 'label' : 'link';
  if(type === 'link') {
    var expired = Math.random() > 0.6;
    var image = Math.floor((Math.random() - 0.01) * 4);

    return {
      exp_id :  'Experience #' + id,
      label : 'Experience #' + id,
      state : expired ? 'expired' : 'current',
      start : expired ? '2016/11/08 14:30:00' : moment(Date.now() - 3600000 * Math.random()*2).format('YYYY/MM/DD HH:mm:ss'),
      end : expired ? '2016/11/08 15:00:00' : moment(Date.now() + 3600000 * Math.random()*5).format('YYYY/MM/DD HH:mm:ss'),
      hero_photo : 'public/event-bg' + image + '.png',
      content : 'this is the text description',
      pin_id : null
    };
  }
  else {
    return {
      exp_id : 'Experience #' + id,
      label : 'Label only',
      content : 'this is the text description',
      pin_id : null
    };
  }
};


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
