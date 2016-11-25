var regions = [[
    // north west
    {lat: -33.3686095, lng: 149.7558751},
    // north east
    {lat: -33.3686095, lng: 149.3558751},
    // south east
    {lat: -33.5286095, lng: 149.3558751},
    // south west
    {lat: -33.5286095, lng: 149.7558751},
]];

$(function() {

  console.log('initialize')
  $('#draw-region').on('click',function() {

    drawRegion(regions[0])
  });

});

function drawRegion(region) {

  // Construct the polygon.
  var bermudaTriangle = new google.maps.Polygon({
    paths: region,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 3,
    fillColor: '#00000000',
    fillOpacity: 0.35
  });
  bermudaTriangle.setMap(map);

  // Add a listener for the click event.
  bermudaTriangle.addListener('click', showArrays);

  infoWindow = new google.maps.InfoWindow;
}

/** @this {google.maps.Polygon} */
function showArrays(event) {
  // Since this polygon has only one path, we can call getPath() to return the
  // MVCArray of LatLngs.
  var vertices = this.getPath();

  var contentString = '<b>region </b><br>' +
      'Clicked location: <br>' + event.latLng.lat() + ',' + event.latLng.lng() +
      '<br>';

  // Iterate over the vertices.
  for (var i =0; i < vertices.getLength(); i++) {
    var xy = vertices.getAt(i);
    contentString += '<br>' + 'Coordinate ' + i + ':<br>' + xy.lat() + ',' +
        xy.lng();
  }

  // Replace the info window's content and position.
  infoWindow.setContent(contentString);
  infoWindow.setPosition(event.latLng);

  infoWindow.open(map);
}

function handleMap(map){
    var getBounds = getFnDefineBounds();
    var drawRect = getFnDrawRect();
    map.addListener('click', function(event) {
        bounds = getBounds({ lat: event.latLng.lat(), lng: event.latLng.lng() }, map);
        drawRect(bounds);
    });
}

function getFnDrawRect(){
    var rect;
    return function(bounds){
        clearIfNeed();
        if(bounds){
            rect = new google.maps.Rectangle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillOpacity: 0,
                map: map,
                bounds: bounds
            });
        }
    }
    function clearIfNeed(){
        if(rect){
            rect.setMap(null);
            rect = null;
        }
    }
}

function getFnDefineBounds(){
    var count = 0;
    var markerAry = [];
    return function(location, map){
        var oldMarker;
        var newMarker = new google.maps.Marker({
                position: location,
                animation: google.maps.Animation.DROP,
                map: map
        });

        if(count%2==0){
            oldMarker = markerAry[0];
            markerAry[0] = newMarker;
        }
        else{
            oldMarker = markerAry[1];
            markerAry[1] = newMarker;
        }

        clearIfNeed(oldMarker, infowindow);

        var infowindow = new google.maps.InfoWindow();
        infowindow.setContent('lat: ' + location.lat + '<br>' + 'lng: ' + location.lng);
        infowindow.open(map, newMarker);

        count++;

        return getBounds(markerAry);
    }
    function clearIfNeed(oldMarker, infowindow){
        if(infowindow){
            infowindow.close();
        }
        if(oldMarker){
            oldMarker.setMap(null);
            oldMarker = null;
        }
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
}

function extendBound(map, latLngLiteral){
    var bounds = map.getBounds();
    bounds.extend(latLngLiteral);
    map.fitBounds(bounds);
}
