$(function() {

  $('#render-btn').click(function() {
    var region = $('#region').val()
    $.get('/bounds/'+region, function(data) {
      var bounds = JSON.parse(data).bounds;
      console.log('bounds=', bounds)
      $('#ub-lat').val(bounds[0].lat);
      $('#ub-lng').val(bounds[0].lng);
      $('#lb-lat').val(bounds[2].lat);
      $('#lb-lng').val(bounds[2].lng);
    })
    renderTiles()
  })

  $('.update-btn').click(function() {
    // {"bounds":[{"lat":"-34.921073745369675","lng":"138.6085581777948"},{"lat":"-34.921073745369675","lng":"138.6272251304265"},{"lat":"-34.93560465273544","lng":"138.6272251304265"},{"lat":"-34.93560465273544","lng":"138.6085581777948"}]}
    var xhr = new XMLHttpRequest();
    var c1 = { lat : $('#ub-lat').val(), lng : $('#ub-lng').val() };
    var c2 = { lat : $('#lb-lat').val(), lng : $('#lb-lng').val() };
    var region = $('#region').val()
    var body = {
      bounds : [
        c1,
        { lat : c1.lat, lng : c2.lng },
        c2,
        { lat : c2.lat, lng : c1.lng },
      ]
    };
    console.log('body', body)
    xhr.open('POST', '/bounds/'+region);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(body));
  })

  $('.move').click(function() {
    var dx = $(this).attr('x') || 0
    var dy = $(this).attr('y') || 0
    var coords = $('#coords').val()
    var x = (+String(coords).split(',')[1])+Math.floor(dx)
    var z = String(coords).split(',')[0]
    var y = (+String(coords).split(',')[2])+Math.floor(dy)
    $('#coords').val([z,x,y].join(','));
    renderTiles()
  })

  function renderTiles() {
    var region = $('#region').val()
    var coords = $('#coords').val()
    var height = $('#height').val()
    var width = $('#width').val()
    console.log('render ',region, 'coords:', coords, 'height=', height, 'width=', width)
    $('#tiles').empty()
    for(var i = 0; i < height; i++) {
      var row = $('<div style="line-height:0"></div>')
      for(var j = 0; j < width; j++) {
        var id = String(coords).split(',')
        var z = id[0]
        var x = (+id[1]) + j
        var y = (+id[2]) + i
        var res = [z,x, y].join('/')
        var wrapper = $('<div class="tile-wrapper"></div>')
        var tile = $('<img class="overlay-tile" height="128" width="128" src="/tiles/debug/'+region+'/'+res+'?v='+Date.now()+'"/>')
        var tilebg = $('<img class="overlay-tile" height="128" width="128" src="/base/'+[z,x,y].join('/')+'"/>')
        wrapper.append(tilebg)
        wrapper.append(tile)
        row.append(wrapper)
      }
      $('#tiles').append(row)
    }
  }

})
