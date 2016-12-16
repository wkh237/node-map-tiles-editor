var Canvas = require('canvas');
var Image = Canvas.Image;
var moment = require('moment');
var fs = require('fs');
var util = require('util');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;
var cp = require('child_process').exec;
let img = new Image;
let imageCache = {};

console.log(process.argv);

var regionName = process.argv[2];
var min = +process.argv[3];
var max = +process.argv[4];
var val = JSON.parse(fs.readFileSync('./regions/'+regionName+'.json')).bounds;
console.log(val)
console.log('generate tiles:', regionName, min+'x', '~', max+'x');
// get tms bounds for each zoom level
var total = 0;
var ranges = [];
for(var i = min; i <= max ; i++) {
  var lt = getTileAtLatLng(val[0], i);
  var rb = getTileAtLatLng(val[2], i);
  var w = Math.abs(rb.x-lt.x);
  var h = Math.abs(rb.y-lt.y);
  ranges.push({
    zoom : i,
    lt : lt,
    rb : rb,
    width : w,
    height : h,
    number : w*h
  });
  total += w*h;
}
console.log('tiles needs to be generated :', total);
var now = 0;
var start = Date.now();
for(var i=min;i<=max;i++) {
  var lt = getTileAtLatLng(val[0], i);
  var rb = getTileAtLatLng(val[2], i);
  for(var j = lt.x; j < rb.x;j++){
    for(var k=lt.y; k < rb.y;k++) {
      createTileFromRawImage(regionName, j,k,i, function() {
        now++;
        var time = Math.floor((total-now)*((Date.now() - start)/now)/1000);
        process.stdout.write('Processing .. ' +  (now) + '/' + total + ' --> ' + (now/total*100).toFixed(2) + '% [' +time + '] seconds remains    \033[0G' );
      });
    }
  }
}
console.log('Task finished,', Math.floor((Date.now() - start)/1000), 'seconds elapsed                                                    ');

function tileToLatLng(x,y,z) {
  var result = { lat : tileToLat(y,z), lng : tileToLong(x,z) };;
  return result;
}

function tileToLong(x,z) { return (x/Math.pow(2,z)*360-180); }

function tileToLat(y,z) {
    var n = Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

function createTileFromRawImage(region, x, y, z, cb) {
  x = Math.floor(x);
  y = Math.floor(y);
  z = Math.floor(z);
  let data = fs.readFileSync(`./regions/${region}.json`);

  let {bounds} = JSON.parse(data);
  let tileBounds = [
    tileToLatLng(x,y,z),
    tileToLatLng(x+1,y,z),
    tileToLatLng(x+1,y+1,z),
    tileToLatLng(x,y+1,z)
  ];

  var raw = imageCache[region] ? imageCache[region] : fs.readFileSync(`./region-raw-img/${region}.png`);
  let img = new Image;
  img.src = raw;

  let regionWidth = Math.abs(Math.abs(bounds[0].lng) - Math.abs(bounds[1].lng)),
      regionHeight = Math.abs(Math.abs(bounds[1].lat) - Math.abs(bounds[2].lat));

  let tileWidth = Math.abs(tileBounds[0].lng - tileBounds[1].lng) * img.width /regionWidth,
      tileHeight = Math.abs(tileBounds[1].lat - tileBounds[2].lat) * img.height /regionHeight;

  let tileImg = new Canvas(256, 256);
  let originX = (Math.abs(tileBounds[0].lng) - Math.abs(bounds[0].lng))/regionWidth * img.width;
  let originY = (Math.abs(tileBounds[0].lat) - Math.abs(bounds[0].lat))/regionHeight * img.height;
  let ctx = tileImg.getContext('2d');

  if( originX > img.width + tileWidth ||
      originY > img.height + tileHeight ||
      originY < -tileHeight -1 || originX < -tileWidth -1 ) {
    return
  }
  else {
    ctx.drawImage(img, originX, originY, tileWidth, tileHeight, 0, 0, 256, 256);
    ctx.strokeStyle = 'transparent';
    ctx.strokeRect(0, 0, 256, 256);
  }

  var bytes = tileImg.toBuffer(undefined, 3, ctx.PNG_FILTER_NONE);

  var dir = `./regions/${region}/${z}/${x}${y}.png`;
  mkdirp.sync(getDirName(dir));
  fs.writeFileSync(dir, bytes);
  cb();

}

var deleteFolderRecursive = function(path, cb) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
  cb()
};

function fromLatLngToPoint (latLng){
  var siny =  Math.min(Math.max(Math.sin(latLng.lat* (Math.PI / 180)), -.9999),.9999);
  return {
    x: 128 + latLng.lng * (256/360),
    y: 128 + 0.5 * Math.log((1 + siny) / (1 - siny)) * -(256 / (2 * Math.PI))
  };
}

function getTileAtLatLng(latLng,zoom){
  var t=Math.pow(2,zoom),
      s=256/t,
      p=fromLatLngToPoint(latLng);
      return {x:Math.floor(p.x/s),y:Math.floor(p.y/s),z:zoom};
}
