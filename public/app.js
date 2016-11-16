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
