var map = null;
var markers = [];
var rect = null;
var app = new Vue({
  el: '#app',

  // data context

  data: {
    regions : [],
    selectedRegion : null,
    regionZoom : 15,
    regionCenter : { lat : 0, lng : 0 },
    viewerTMSCoord : '17,116005,79122',
    viewerWidth : 3,
    viewerHeight : 3,
    tiles : [],
    json : '',
    selectedBounds : [{lat:0, lng:0},{lat:0, lng:0},{lat:0, lng:0},{lat:0, lng:0}],
    config : {
      zoomMin : 8,
      zoomMax : 19,
      ranges : []
    },
  },

  // lifecycle

  created : function() {
    this.getRegions();
  },

  // watch prop changes

  watch : {

    selectedBounds : function(val) {
      var json = { bounds: val };
      app.json = JSON.stringify(json);
      // get tms bounds for each zoom level
      var min = app.config.zoomMin;
      var max = app.config.zoomMax;
      var ranges = [];
      for(var i = min; i <= max ; i++) {
        var lt = getTileAtLatLng(val[0], i);
        var rb = getTileAtLatLng(val[2], i);
        console.log(lt,rb,i)
        ranges.push({
          zoom : i,
          lt : lt,
          rb : rb,
          width : Math.abs(rb.x-lt.x),
          height : Math.abs(rb.y-lt.y),
          number : Math.abs((rb.x-lt.x) * (rb.y-lt.y))
        })
      }
      console.log(ranges);
      app.config.ranges = ranges;
    },

    regionZoom : function(val) {
      map.setZoom(val);
    },

    selectedRegion : function(key) {
      console.log(key)
      var region = null;
      for(var i in app.regions) {
        if(app.regions[i].name === key) {
          region = app.regions[i];
          break
        }
      }
      console.log(region);
      if(!region)
        return;
      var center = {
        lat : ((+region.bounds[0].lat) + (+region.bounds[2].lat))/2,
        lng : ((+region.bounds[0].lng) + (+region.bounds[2].lng))/2
      };
      map.setZoom(app.regionZoom);
      map.setCenter(center);
      $.get('/bounds/' + key, function(data) {
        var bounds = JSON.parse(data);
        console.log('bounds', bounds);
        // clear rect and redraw
        app.selectedBounds = bounds.bounds;
        for(var i in markers) {
          markers[i].setMap(null);
        }
        rect && rect.setMap(null);
        var marker1 = new google.maps.Marker({
                position: region.bounds[0],
                label : 'LT',
                map: map
        });
        var marker2 = new google.maps.Marker({
                position: region.bounds[2],
                label : 'RB',
                map: map
        });
        markers = [marker1, marker2];
        var rectBounds = {
          north: Math.max(markers[0].position.lat(), markers[1].position.lat()),
          south: Math.min(markers[0].position.lat(), markers[1].position.lat()),
          east: Math.max(markers[0].position.lng(), markers[1].position.lng()),
          west: Math.min(markers[0].position.lng(), markers[1].position.lng())
        };
        rect = new google.maps.Rectangle({
          strokeOpacity: 0.8,
          strokeWeight: 0,
          fillColor: '#007dff',
          fillOpacity: 0.35,
          map: map,
          bounds: rectBounds
        });
      });
      app.regionCenter = center;
    },

  },

  // methods

  methods : {

    stat : function() {
      var json = { bounds: app.selectedBounds };
      app.json = JSON.stringify(json);
      // get tms bounds for each zoom level
      var min = app.config.zoomMin;
      var max = app.config.zoomMax;
      var ranges = [];
      for(var i = min; i <= max ; i++) {
        var lt = getTileAtLatLng(app.selectedBounds[0], i);
        var rb = getTileAtLatLng(app.selectedBounds[2], i);
        console.log(lt,rb,i)
        ranges.push({
          zoom : i,
          lt : lt,
          rb : rb,
          width : Math.abs(rb.x-lt.x),
          height : Math.abs(rb.y-lt.y),
          number : Math.abs((rb.x-lt.x) * (rb.y-lt.y))
        })
      }
      console.log(ranges);
      app.config.ranges = ranges;
    },

    getRegions : function() {
       $.get('/regions', function(data) {
         console.log(app.regions)
         console.log('regions', data);
         regions = data;
         for(var i in data) {
           var meta = data[i];
           app.regions.push(meta)
         }
         console.log(app.regions);

       });
    },

    renderViewer() {
      var z = Math.floor(String(app.viewerTMSCoord).split(',')[0]);
      var x = Math.floor(String(app.viewerTMSCoord).split(',')[1]);
      var y = Math.floor(String(app.viewerTMSCoord).split(',')[2]);
      var tiles = [];

      for(var j = 0; j < app.viewerHeight; j++) {
        var row = [];
        for(var i = 0; i < app.viewerWidth; i++) {
          row.push({
            src : '/tiles/debug/' + app.selectedRegion + '/' + [z, x+i, y+j].join('/') + '?v='+Date.now(),
            base : '/base/' + [z, x+i, y+j].join('/')
          });
        }
        tiles.push(row);
      }
      app.tiles = tiles;
      console.log('render tiles', tiles)
    },

    viewerMove (dx, dy, dz) {
      var coords = String(app.viewerTMSCoord).split(',');
      var x = Math.floor((+coords[1] + dx) * Math.pow(2, dz));
      var z = (+coords[0]) + dz;
      var y = Math.floor((+coords[2] + dy) * Math.pow(2, dz));
      app.viewerTMSCoord = [z,x,y].join(',');
      console.log('viewer move', dx, dy, dz,app.viewerTMSCoord)
      app.renderViewer();
    },

    updateRegionBounds() {
      var body = {};
      body.bounds = app.selectedBounds;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/bounds/'+ app.selectedRegion);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(body));
      console.log(app.selectedBounds);
    }


  },


});


function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: {lat: -34.9270088, lng: 138.6089918},
    mapTypeId: google.maps.MapTypeId.TERRAIN
  });
  map.addListener('click', function(event) {
    if(markers.length > 1) {
      for(var i in markers) {
        markers[i].setMap(null);
      }
      markers = [];
    }
    var ll = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    bounds = getBounds(ll, map);
    var marker = new google.maps.Marker({
            position: ll,
            label : markers.length === 0 ? 'LT' : 'RB',
            map: map
    });
    var info = new google.maps.InfoWindow();
    info.setContent('lat: ' + ll.lat + '<br>' + 'lng: ' + ll.lng);
    info.open(map, marker);
    markers.push(marker);
    // draw rect
    if(markers.length === 2) {
      var bounds = {
        north: Math.max(markers[0].position.lat(), markers[1].position.lat()),
        south: Math.min(markers[0].position.lat(), markers[1].position.lat()),
        east: Math.max(markers[0].position.lng(), markers[1].position.lng()),
        west: Math.min(markers[0].position.lng(), markers[1].position.lng())
      };
      rect && rect.setMap(null);
      rect = new google.maps.Rectangle({
        strokeOpacity: 0.8,
        strokeWeight: 0,
        fillColor: '#007dff',
        fillOpacity: 0.35,
        map: map,
        bounds: bounds
      });
      app.selectedBounds = [
        { lat : bounds.west, lng : bounds.north  },
        { lat : bounds.east, lng : bounds.north  },
        { lat : bounds.east, lng : bounds.south  },
        { lat : bounds.west, lng : bounds.south  },
      ];
      console.log('rectBounds', bounds)
    }
  });
}

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
      p=this.fromLatLngToPoint(latLng);
      return {x:Math.floor(p.x/s),y:Math.floor(p.y/s),z:zoom};
}

function getBounds(markerAry){
    if(markerAry && markerAry.length >1){
        var n, s, w, e;
        var lat = [];
        lat[0] = markerAry[0].position.lat();
        lat[1] = markerAry[1].position.lat();
        if(Math.abs(lat[0]) < Math.abs(lat[1])){
            n = lat[0];
            s = lat[1];
        }
        else{
            s = lat[0];
            n = lat[1];
        }
        var lng = [];
        lng[0] = markerAry[0].position.lng();
        lng[1] = markerAry[1].position.lng();
        if(Math.abs(lng[0]) < Math.abs(lng[1])){
            w = lng[0];
            e = lng[1];
        }
        else{
            e = lng[0];
            w = lng[1];
        }
        return {north: n, south: s, west: w, east: e};
    }
}
