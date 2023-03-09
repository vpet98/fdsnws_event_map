function serialize(form, loc='query') {
	if ( !form || form.nodeName !== "FORM" ) {
		return;
	}

	var query = loc;
	var element, option, i, j, q = [];
	for ( i = 0; element = form.elements[i]; i++ ) {
		if ( element.name === "" || element.disabled || element.offsetParent === null ) {
			continue;
		}

		// the queryauth input is treated separately
		if ( element.name === 'queryauth' ) {
			if ( element.checked ) {
				query = element.value;
			}
			continue;
		}


		switch ( element.nodeName ) {
		case 'INPUT':
			if ( element.value == "" ) {
				break;
			}

			switch ( element.type ) {
			case 'text':
			case 'number':
			case 'hidden':
			case 'password':
			case 'button':
			case 'reset':
      case 'datetime-local':
        q.push(element.name + "=" + encodeURIComponent(element.value));
        break;

			case 'submit':
				q.push(element.name + "=" + encodeURIComponent(element.value));
				break;

			case 'checkbox':
			case 'radio':
				if ( element.checked ) {
					q.push(element.name + "=" + encodeURIComponent(element.value));
				}
				break;

			case 'file':
				break;
			}

			break;

		case 'TEXTAREA':
			if ( element.value == "" ) {
				break;
			}

			q.push(element.name + "=" + encodeURIComponent(element.value));
			break;

		case 'SELECT':
			switch ( element.type ) {
			case 'select-one':
				if ( element.value == "" ) {
					break;
				}

				q.push(element.name + "=" + encodeURIComponent(element.value));
				break;

			case 'select-multiple':
				values = null
				for ( j = 0; option = element.options[j]; j++ ) {
					if ( option.selected ) {
						v = encodeURIComponent(option.value)
						if ( values === null ) {
							values = v;
						}
						else {
							values += "," + v;
						}
					}
				}
				if ( values !== null ) {
					q.push(element.name + "=" + values);
				}
				break;
			}
			break;

		case 'BUTTON':
			if ( element.value == "" ) {
				break;
			}

			switch ( element.type ) {
			case 'reset':
			case 'submit':
			case 'button':
				q.push(element.name + "=" + encodeURIComponent(element.value));
				break;
			}
			break;
		}
	}

	var params = q.join("&");
	return params.length === 0 ? query : query + '?' + params;
}

function fdsnwsInitQueryForm() {

  var queryForm = document.getElementById('query-form');
  var queryURL = document.getElementById('query-url');

	function updateQueryURL() {
		var url = 'https://eida.gein.noa.gr/fdsnws/event/1/' + serialize(queryForm)
		queryURL.setAttribute('href', url);
		queryURL.innerHTML = url;
	}

	function toggleLocation() {
		for ( i = 0; radio = locRadios[i]; i++ ) {
			var input = document.getElementById(radio.id + '-input');
			if ( input ) {
				input.style.display = radio.checked ? 'block' : 'none';
			}
		}
    updateQueryURL();
	}

	var element, i;
	var elements = queryForm.getElementsByTagName('input');
	var locRadios = []
	for ( i = 0; element = elements[i]; i++ ) {
		if ( element.type === 'radio' && element.name === 'location' ) {
			locRadios.push(element);
			element.onclick = toggleLocation;
		}
    else {
			element.oninput = updateQueryURL
			element.onchange = updateQueryURL
		}
	}

  var elements = queryForm.getElementsByTagName('select');
	for ( i = 0; element = elements[i]; i++ ) {
		element.onchange = updateQueryURL
	}

	toggleLocation();
  updateQueryURL();

  // default time to 00:00 if user does not select any
  const myDateTimes = document.querySelectorAll("input[type=datetime-local]");
  myDateTimes.forEach(function(dateTime) {
    dateTime.addEventListener("input", function() {
      const currentValue = dateTime.value;
      const currentDate = new Date(currentValue);
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      if (currentHour === new Date().getHours() && currentMinute === new Date().getMinutes()) {
       const newValue = currentValue.split("T")[0] + "T00:00";
       dateTime.value = newValue;
      }
    });
  });

}

function mapEvents() {
  // get useful elements
  var queryForm = document.getElementById('query-form');
  var queryURL = document.getElementById('query-url');
  var selectFormat = document.getElementsByName('format')[0];
  var url = 'https://eida.gein.noa.gr/fdsnws/event/1/' + serialize(queryForm)

  // clear map
  map.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  // define url used to fetch events for the map
  var fetchUrl = url;
  if (selectFormat.value !== 'text') {
    if (!url.includes('format=')) {
      if (url.includes('query?')) {
        fetchUrl = url+'&format=text';
      }
      else {
        fetchUrl = url+'?format=text';
      }
    }
    else {
      fetchUrl = url.replace(`format=${selectFormat.value}`, 'format=text');
    }
  }
  fetchUrl = fetchUrl.replace('&nodata=404', '').replace('?nodata=404', '?').replace(/\?$/, '');
  fetchUrl = fetchUrl.replace('&formatted=true', '').replace('?formatted=true', '?').replace(/\?$/, '');

  // get map icons
  var icons = {
    'smVShal': L.icon({iconUrl: './images/small_veryshallow.png'}),
    'smShal': L.icon({iconUrl: './images/small_shallow.png'}),
    'smDeep': L.icon({iconUrl: './images/small_deep.png'}),
    'smVDeep': L.icon({iconUrl: './images/small_verydeep.png'}),
    'smDeepest': L.icon({iconUrl: './images/small_deepest.png'}),
    'avVShal': L.icon({iconUrl: './images/average_veryshallow.png'}),
    'avShal': L.icon({iconUrl: './images/average_shallow.png'}),
    'avDeep': L.icon({iconUrl: './images/average_deep.png'}),
    'avVDeep': L.icon({iconUrl: './images/average_verydeep.png'}),
    'avDeepest': L.icon({iconUrl: './images/average_deepest.png'}),
    'bigVShal': L.icon({iconUrl: './images/big_veryshallow.png'}),
    'bigShal': L.icon({iconUrl: './images/big_shallow.png'}),
    'bigDeep': L.icon({iconUrl: './images/big_deep.png'}),
    'bigVDeep': L.icon({iconUrl: './images/big_verydeep.png'}),
    'bigDeepest': L.icon({iconUrl: './images/big_deepest.png'}),
    'crVShal': L.icon({iconUrl: './images/crucial_veryshallow.png'}),
    'crShal': L.icon({iconUrl: './images/crucial_shallow.png'}),
    'crDeep': L.icon({iconUrl: './images/crucial_deep.png'}),
    'crVDeep': L.icon({iconUrl: './images/crucial_verydeep.png'}),
    'crDeepest': L.icon({iconUrl: './images/crucial_deepest.png'}),
    'classic': L.icon({iconUrl: './images/event.png'})
  }

  // show message while loading
  const loadingMsg = document.createElement('div');
  loadingMsg.id = 'loadmsg'
  loadingMsg.innerHTML = 'Loading data, please wait...';
  parentEl = document.getElementsByClassName("container");
  parentEl[0].appendChild(loadingMsg);

  function flashLoadingMessage() {
    if (loadingMsg.innerHTML === "Loading data, please wait...") {
      loadingMsg.innerHTML = "Loading data, please wait";
    } else {
      loadingMsg.innerHTML += ".";
    }
  }

  setInterval(flashLoadingMessage, 500);

  // fetch events
  fetch(fetchUrl)
  .then(response => response.text())
  .then(data => {
    loadingMsg.remove(); // delete loading message
    for (l of data.split('\n').slice(1)) {
      if (l) {
        let fields = l.split('|')
        let marker;
        if (fields[4] < 15 && fields[10] < 2.5) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['smVShal']}).addTo(map);
        }
        else if (fields[4] >= 15 && fields[4] < 30 && fields[10] < 2.5) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['smShal']}).addTo(map);
        }
        else if (fields[4] >= 30 && fields[4] < 60 && fields[10] < 2.5) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['smDeep']}).addTo(map);
        }
        else if (fields[4] >= 60 && fields[4] < 100 && fields[10] < 2.5) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['smVDeep']}).addTo(map);
        }
        else if (fields[4] >= 100 && fields[10] < 2.5) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['smDeepest']}).addTo(map);
        }
        else if (fields[4] < 15 && fields[10] >= 2.5 && fields[10] < 4.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['avVShal']}).addTo(map);
        }
        else if (fields[4] >= 15 && fields[4] < 30 && fields[10] >= 2.5 && fields[10] < 4.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['avShal']}).addTo(map);
        }
        else if (fields[4] >= 30 && fields[4] < 60 && fields[10] >= 2.5 && fields[10] < 4.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['avDeep']}).addTo(map);
        }
        else if (fields[4] >= 60 && fields[4] < 100 && fields[10] >= 2.5 && fields[10] < 4.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['avVDeep']}).addTo(map);
        }
        else if (fields[4] >= 100 && fields[10] >= 2.5 && fields[10] < 4.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['avDeepest']}).addTo(map);
        }
        else if (fields[4] < 15 && fields[10] >= 4.0 && fields[10] < 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['bigVShal']}).addTo(map);
        }
        else if (fields[4] >= 15 && fields[4] < 30 && fields[10] >= 4.0 && fields[10] < 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['bigShal']}).addTo(map);
        }
        else if (fields[4] >= 30 && fields[4] < 60 && fields[10] >= 4.0 && fields[10] < 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['bigDeep']}).addTo(map);
        }
        else if (fields[4] >= 60 && fields[4] < 100 && fields[10] >= 4.0 && fields[10] < 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['bigVDeep']}).addTo(map);
        }
        else if (fields[4] >= 100 && fields[10] >= 4.0 && fields[10] < 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['bigDeepest']}).addTo(map);
        }
        else if (fields[4] < 15 && fields[10] >= 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['crVShal']}).addTo(map);
        }
        else if (fields[4] >= 15 && fields[4] < 30 && fields[10] >= 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['crShal']}).addTo(map);
        }
        else if (fields[4] >= 30 && fields[4] < 60 && fields[10] >= 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['crDeep']}).addTo(map);
        }
        else if (fields[4] >= 60 && fields[4] < 100 && fields[10] >= 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['crVDeep']}).addTo(map);
        }
        else if (fields[4] >= 100 && fields[10] >= 4.0 && fields[10] >= 5.0) {
          marker = L.marker([fields[2], fields[3]], {icon: icons['crDeepest']}).addTo(map);
        }
        else {
          marker = L.marker([fields[2], fields[3]], {icon: icons['classic']}).addTo(map);
        }
        marker.bindPopup(`Time: ${fields[1].replace('T', ' ').replace(/\.(\d{2}).*$/, '.$1')}<br>
          Depth (km): ${parseFloat(fields[4]).toFixed(2)}<br>Magnitude: ${parseFloat(fields[10]).toFixed(2)}`);
      }
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}
