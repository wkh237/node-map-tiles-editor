var map = null;
var markers = [];
var rect = null;
var overlay = null;
var app = new Vue({
  el: '#app',

  // data context

  data: {
    regions : [],
    selectedRegion : null,
    selectedImage : null,
    regionZoom : 15,
    regionCenter : { lat : 0, lng : 0 },
    viewerTMSCoord : '',
    viewerWidth : 3,
    viewerHeight : 3,
    tiles : [],
    images : [],
    overlayURI : '',
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
    this.getImages();
  },

  // watch prop changes

  watch : {

    overlayURI : function(val) {
      updateRegionRectAndOverlay()
    },

    selectedBounds : function(val) {
      // get tms bounds for each zoom level
      var min = app.config.zoomMin;
      var max = app.config.zoomMax;
      var ranges = [];
      for(var i = min; i <= max ; i++) {
        var lt = getTileAtLatLng(val[0], i);
        var rb = getTileAtLatLng(val[2], i);
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
      var json = { name : app.selectedRegion, image : app.selectedImage, bounds: app.selectedBounds };
      app.json = JSON.stringify(json, null, '  ');
    },

    selectedRegion : function(key) {
      console.log('change region to ', key)
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
      console.log(app.overlayURI)
      var center = {
        lat : ((+region.bounds[0].lat) + (+region.bounds[2].lat))/2,
        lng : ((+region.bounds[0].lng) + (+region.bounds[2].lng))/2
      };
      map.setZoom(app.regionZoom);
      map.setCenter(center);
      $.get('/bounds/' + key, function(data) {
        var bounds = JSON.parse(data);
        console.log('bounds', bounds);
        // place new markers
        for(var i in markers) {
          markers[i].setMap(null);
        }
        rect && rect.setMap(null);
        var marker1 = new google.maps.Marker({
                position: region.bounds[0],
                label : 'LT',
                map: map,
                draggable : true
        });
        marker1.addListener('drag', updateRegionRectAndOverlay);
        var marker2 = new google.maps.Marker({
                position: region.bounds[2],
                label : 'RB',
                map: map,
                draggable : true
        });
        marker2.addListener('drag', updateRegionRectAndOverlay);
        markers = [marker1, marker2];
        // redraw
        app.selectedBounds = bounds.bounds;
        app.selectedImage = region.image;
        app.overlayURI = '/overlay/' + region.name;
        var json = { name : app.selectedRegion, image : app.selectedImage, bounds: app.selectedBounds };
        app.json = JSON.stringify(json, null, '  ');
      });
      app.regionCenter = center;
    },

    selectedImage(val) {
      var json = { name : app.selectedRegion, image : app.selectedImage, bounds: app.selectedBounds };
      app.json = JSON.stringify(json, null, '  ');
      app.overlayURI = '/region-raw-img/'+val;
    }

  },

  // methods

  methods : {

    createRegion : function() {
      var name = window.prompt('Please enter id of the region');
      var json = {
        bounds : [{lat:0, lng:0},{lat:0, lng:0},{lat:0, lng:0},{lat:0, lng:0}]
      };
      var xhr = new XMLHttpRequest();
      xhr.open('POST','/regions/'+name);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(json));
      xhr.onreadystatechange = function() {
        if(xhr.readyState === 4) {
          app.getRegions();
        }
      }

    },

    createImage : function() {

    },

    setTMSCoords : function(val) {
      var coords = [val.zoom, val.lt.x, val.lt.y].join(',');
      app.viewerTMSCoord = coords;
      app.renderViewer();
    },

    navigate : function() {
      console.log(app.regionCenter)
      map.setCenter(app.regionCenter);
    },

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

    getRegions() {
      $.get('/regions', function(data) {
       console.log('regions', data);
       var next = [];
       regions = data;
       for(var i in data) {
         var meta = data[i];
         next.push(meta)
       }
       app.regions = next;
       console.log(app.regions);

      });
    },

    getImages() {
      $.get('/images', function(data) {
       console.log('images', data);
       app.images = data;
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

    save() {
      var xhr = new XMLHttpRequest();
      xhr.open('PUT', '/regions/'+ app.selectedRegion);
      xhr.setRequestHeader('Content-Type', 'application/json');
      app.json.image = app.selectedImage;
      xhr.send(app.json);
    },

  },


});


function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: {lat: -34.9270088, lng: 138.6089918},
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    scrollwheel:  false
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
            draggable : true,
            map: map
    });
    marker.addListener('drag', updateRegionRectAndOverlay);
    var info = new google.maps.InfoWindow();
    info.setContent('lat: ' + ll.lat + '<br>' + 'lng: ' + ll.lng);
    info.open(map, marker);
    markers.push(marker);
    // draw rect
    if(markers.length === 2) {
      var bounds = getBoundsFromMarkers();
      rect && rect.setMap(null);
      updateRegionRectAndOverlay();
      console.log('rectBounds', bounds)
    }
  });
}

function updateRegionRectAndOverlay() {
  console.log('redraw ..')
  if(markers.length < 2) {
    return;
  }
  overlay && overlay.setMap(null);
  rect && rect.setMap(null);
  var rectBounds = getBoundsFromMarkers();
  rect = new google.maps.Rectangle({
    strokeOpacity: 0.8,
    strokeColor : '#00b2ff',
    strokeWeight: 2,
    fillColor: '#00b2ff',
    fillOpacity: 0.10,
    draggable : true,
    map: map,
    zIndex : 0,
    bounds: rectBounds
  });
  rect.addListener('dragend', function() {
    var rt = {
      lat : rect.getBounds().getNorthEast().lat(),
      lng : rect.getBounds().getNorthEast().lng(),
    };
    var lb = {
      lat : rect.getBounds().getSouthWest().lat(),
      lng : rect.getBounds().getSouthWest().lng(),
    };
    if(markers.lengt <2)
      return;
    markers[0].setPosition({ lat : lb.lat, lng : rt.lng });
    markers[1].setPosition({ lat : rt.lat, lng : lb.lng });
    overlay && overlay.setMap(null);
    overlay = new google.maps.GroundOverlay(app.overlayURI, getBoundsFromMarkers());
    overlay.setMap(map);
    app.selectedBounds = getTileRegionBoundsFromMarkers();
  });
  if(app.overlayURI) {
    overlay && overlay.setMap(null);
    overlay =  new google.maps.GroundOverlay(app.overlayURI, rectBounds);
    overlay.setMap(map)
  }
  app.selectedBounds = getTileRegionBoundsFromMarkers();
}

function getTileRegionBoundsFromMarkers() {
  var bounds = getBoundsFromMarkers();
  return [
    { lng : bounds.west, lat : bounds.north  },
    { lng : bounds.east, lat : bounds.north  },
    { lng : bounds.east, lat : bounds.south  },
    { lng : bounds.west, lat : bounds.south  },
  ];
}

function getBoundsFromMarkers() {
  if(markers.length < 2)
    return null;
  return {
    north: Math.max(markers[0].position.lat(), markers[1].position.lat()),
    south: Math.min(markers[0].position.lat(), markers[1].position.lat()),
    east: Math.max(markers[0].position.lng(), markers[1].position.lng()),
    west: Math.min(markers[0].position.lng(), markers[1].position.lng())
  };
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
