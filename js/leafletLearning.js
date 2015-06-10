var map = L.map('map', {
	center: [37.8, -96],
	zoom: 4,
	minZoom: 3,
	maxZoom: 18
});

L.tileLayer(
	'http://{s}.tile.osm.org/{z}/{x}/{y}.png', 
	{
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}
).addTo(map);

L.geoJson(statesData).addTo(map);

function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

L.geoJson(statesData, {style: style}).addTo(map);