L.LabelOverlay = L.Class.extend({
    initialize: function(/*LatLng*/ latLng, /*String*/ label, options) {
        this._latlng = latLng;
        this._label = label;
        L.Util.setOptions(this, options);
    },
    options: {
        offset: new L.Point(0, 2)
    },
    onAdd: function(map) {
        this._map = map;
        if (!this._container) {
            this._initLayout();
        }
        map.getPanes().overlayPane.appendChild(this._container);
        this._container.innerHTML = this._label;
	var width = this._container.offsetWidth;
	// perhaps i could test zoom here?
	// it doesn't really make sense here thought
	this.options.offset.x = (width / 2) * -1;
	this.options.offset.y = 10;
        map.on('viewreset', this._reset, this);
        this._reset();
    },
    onRemove: function(map) {
        map.getPanes().overlayPane.removeChild(this._container);
        map.off('viewreset', this._reset, this);
    },
    _reset: function() {
        var pos = this._map.latLngToLayerPoint(this._latlng);
        var op = new L.Point(pos.x + this.options.offset.x, pos.y - this.options.offset.y);
        L.DomUtil.setPosition(this._container, op);
    },
    _initLayout: function() {
        this._container = L.DomUtil.create('div', 'leaflet-label-overlay');
    }
});  

$(document).ready(function(){

    // main map object
    var map = L.map('map').setView([44.8156,-89.5349], 7);
    // colors
    var shorewest_red = "#000";
    var county_label_layers = L.layerGroup();
    var community_label_layers = L.layerGroup();

    // county init styles
    var county_styles = {
	"color": "black",
	"weight": 1,
	"opacity": .5,
	"fillColor":"white",
        "fillOpacity": 1
    };

    var county_active_style = {
	"color": "black",
	"weight": 1,
	"opacity": 1,
	"fillColor":"pink",
        "fillOpacity": .5
    };

    var county_demoted_style = {
	"color": "black",
	"weight": 1,
	"opacity": 1,
	"fillColor":"grey",
        "fillOpacity": 1
    };

    var community_styles = {
	"color": "red",
	"weight": 1,
	"opacity": 1,
	"fillColor":"white",
        "fillOpacity": 1
    };

    var community_active_style = {
	"color": "red",
	"weight": 1,
	"opacity": 1,
	"fillColor":"pink",
        "fillOpacity": 1
    };
    
    // google map styles
    var ggl_map_style_labels = [
	{
	    "stylers": [
		{ "visibility": "off" }
	    ]
	},{
	    "featureType": "administrative.locality",
	    "elementType":"labels",
	    "stylers": [
		{ "visibility": "on" },
	    ]
	},{
	    "featureType": "road",
	    "stylers": [
		{ "visibility": "simplified" },
		{ "hue": shorewest_red },
		{ "lightness": 0 },
		{ "gamma": 1 }
	    ]
	}
    ];
    var ggl_map_style_nolabels = [
	{
	    "stylers": [
		{ "visibility": "off" }
	    ]
	},{
	    "featureType": "administrative.locality",
	    "elementType":"labels",
	    "stylers": [
		{ "visibility": "off" },
	    ]
	},{
	    "featureType": "road",
	    "stylers": [
		{ "visibility": "simplified" },
		{ "hue": shorewest_red },
		{ "lightness": 0 },
		{ "gamma": 1 }
	    ]
	}
    ];

    // google street/city label layer
    ggl_layer_labels = new L.Google('ROADMAP', {
    	mapOptions: {
    	    styles: ggl_map_style_labels
    	}
    });
    ggl_layer_nolabels = new L.Google('ROADMAP', {
    	mapOptions: {
    	    styles: ggl_map_style_nolabels
    	}
    });



    // google street/city label layer
    // ggl_layer2 = new L.Google('ROADMAP', {
    // 	mapOptions: {
    // 	    styles: ggl_map_style2
    // 	}
    // });

    // map.addLayer(ggl_layer2);

    // county layer
    county_layer = L.geoJson(wisc_counties,{
	onEachFeature: onEachCounty,
	style:county_styles
    });

    // community layer
    var community_layer = null;

    map.addLayer(county_layer);
    map.addLayer(county_label_layers);

    function highlightCounty(e) {
    	if (map.getZoom() < 9) {
	    var layer = e.target;
	    layer.setStyle(county_active_style);

	    if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	    }
    	}


    }

    function highlightCommunity(e) {
	var layer = e.target;
	layer.setStyle(community_active_style);

	if (!L.Browser.ie && !L.Browser.opera) {
            layer.bringToFront();
	}
    }

    function resetCountyStyle(e) {
    	county_layer.resetStyle(e.target);
    }

    function resetCommunityStyle(e) {
    	community_layer.resetStyle(e.target);
    }

    function zoomToFeature(e) {
	county_label_layers.clearLayers();
	if(typeof(city_label_layers) !== 'undefined'){
	    city_label_layers.clearLayers();
	}
	if(community_layer !== null){
	    community_layer.clearLayers();
	}
	//county_layer.setStyle(inactive_county_styles);
	map.fitBounds(e.target.getBounds());
	addCommunityLayer(e);

	// geojson.setStyle(function(style_args){
	//     var m_e = e;
	//     m_e.target.setStyle({fillColor:"red"})

	// });
    }

    function styleCounty(e,a){
	//debugger;
    	if (map.getZoom() >= 9) {
	    var layer = e.target;
	    layer.setStyle(county_demoted_style);

	    if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	    }
    	}
    	if (map.getZoom() < 9) {
	    var layer = e.target;
	    layer.setStyle(county_active_style);
	    if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	    }
    	}

    }

    function onEachCounty(feature, layer) {
	var bounds = L.latLngBounds(feature.geometry.coordinates);
 	var lat = bounds.getCenter()['lat'];
 	var lng = bounds.getCenter()['lng'];

	var labelLocation = new L.LatLng(lng,lat);
	var labelTitle = new L.LabelOverlay(labelLocation, "<b id='county-"+feature.properties.NAME.toLowerCase().replace(/ /g, '-')+"'>" + feature.properties.NAME + "</b>");
	labelTitle.COUNTY = feature.properties.NAME;
	//map.addLayer(labelTitle);
	county_label_layers.addLayer(labelTitle);

	layer.on({
            mouseover: highlightCounty,
            mouseout: resetCountyStyle,
            click: zoomToFeature
	});
    }

    function onEachCommunity(feature, layer) {
	var bounds = L.latLngBounds(feature.geometry.coordinates);
 	var lat = bounds.getCenter()['lat'];
 	var lng = bounds.getCenter()['lng'];

	var name = feature.properties.NAMELSAD10;
	//name = name.replace(/city|town|village/gi,'');
	name = name.split(' ').splice(0,name.split(' ').length - 1).join();

	var labelLocation = new L.LatLng(lng,lat);
	var labelTitle = new L.LabelOverlay(labelLocation,'<div style="font-weight:bold">'+name+'</div>');
	//city_label_layers.addLayer(labelTitle); 
	map.addLayer(community_label_layers);

	layer.bindLabel(feature.properties.NAMELSAD10, {noHide:true});
	layer.on({
            mouseover: highlightCommunity,
            mouseout: resetCommunityStyle,
	});
    }

    function getCommunityByCountyID(county_id){
	var communities_filtered = wisc_communities.features.filter(
	    function(e){
		if(e.properties['GEOID10'].substr(2,3) == county_id){
		    return true;
		} else {
		    return false;
		}
	    }
	);
	return {
	    type: "FeatureCollection",
	    features:communities_filtered
	};
    }

    function addCommunityLayer(e){
	var county_id = e.target.feature.properties.COUNTY;
	var community_geojson =  getCommunityByCountyID(county_id);
	community_layer = L.geoJson(community_geojson,{
    	    style:community_styles,
	    onEachFeature: onEachCommunity
	}).addTo(map);	
    }
    map.addLayer(ggl_layer_nolabels);
    map.on('moveend', function () {
	// im going to have to load another google map when zoomed in to show labels
    	    if (map.getZoom() >= 9) {
    		map.removeLayer(ggl_layer_nolabels);
    		map.addLayer(ggl_layer_labels);
    	    }
    	    if (map.getZoom() < 9) {
    		map.removeLayer(ggl_layer_labels);
    		map.addLayer(ggl_layer_nolabels);
    	    }
    });



});

// $(document).ready(function(){
//     var county_label_layers = L.layerGroup();
//     var city_label_layers = L.layerGroup();
    
//     var shorewest_red = "#000";
//     var map = L.map('map').setView([44.8156,-89.5349], 7);

//     var styles = [
// 	{
// 	    "stylers": [
// 		{ "visibility": "off" }
// 	    ]
// 	},{
// 	    "featureType": "road",
// 	    "stylers": [
// 		{ "visibility": "simplified" },
// 		{ "hue": shorewest_red },
// 		{ "lightness": 0 },
// 		{ "gamma": 1 }
// 	    ]
// 	},{
// 	    "featureType": "administrative",
// 	    "elementType":"labels",
// 	    "stylers": [
// 		{ "visibility": "on" },
// 	    ]
// 	}
//     ];

//     ggl = new L.Google('ROADMAP', {
//     	mapOptions: {
//     	    styles: styles
//     	}
//     });

//     var myStyle = {
// 	"color": "black",
// 	"weight": 1,
// 	"opacity": .5,
// 	"fillColor":"white",
//         "fillOpacity": .4
//     };

//     function highlightFeature(e) {
// 	var layer = e.target;
	
// 	layer.setStyle({
//             weight: 1,
//             color: '#000',
//             dashArray: '',
//             fillOpacity: 1
// 	});

// 	if (!L.Browser.ie && !L.Browser.opera) {
//             layer.bringToFront();
// 	}
//     }

//     function highlightFeatureTown(e) {
	
// 	var layer = e.target;

// 	layer.setStyle({
//             weight: 5,
//             color: '#000',
//             dashArray: '',
//             fillOpacity: 1
// 	});

// 	if (!L.Browser.ie && !L.Browser.opera) {
//             layer.bringToFront();
// 	}

// 	//info.update(layer.feature.properties);
//     }

//     function resetHighlight(e) {
// 	geojson.resetStyle(e.target);
//     }

//     function resetHighlightTown(e) {
// 	geojson.resetStyle(e.target);
// 	//info.update();
//     }

//     var zoomToFeature = function(e) {
// 	county_label_layers.clearLayers();
// 	if(typeof(city_label_layers) !== 'undefined'){
// 	    city_label_layers.clearLayers();
// 	}
// 	if(typeof(town_layer) !== "undefined"){
// 	    town_layer.clearLayers();
// 	}
	
// 	map.fitBounds(e.target.getBounds());
// 	add_town_layer(e);

// 	geojson.setStyle(function(style_args){
// 	    var m_e = e;
// 	    m_e.target.setStyle({fillColor:"red"})

// 	});
//     }

//     function onEachFeature(feature, layer) {
// 	var bounds = L.latLngBounds(feature.geometry.coordinates);
//  	var lat = bounds.getCenter()['lat'];
//  	var lng = bounds.getCenter()['lng'];

// 	var labelLocation = new L.LatLng(lng,lat);
// 	var labelTitle = new L.LabelOverlay(labelLocation, "<b id='"+feature.properties.NAME+"'>" + feature.properties.NAME + "</b>");
// 	//map.addLayer(labelTitle);
// 	county_label_layers.addLayer(labelTitle);

// 	layer.on({
//             mouseover: highlightFeature,
//             mouseout: resetHighlight,
//             click: zoomToFeature
// 	});
//     }

//     function onEachFeatureTown(feature, layer) {
// 	var bounds = L.latLngBounds(feature.geometry.coordinates);
//  	var lat = bounds.getCenter()['lat'];
//  	var lng = bounds.getCenter()['lng'];

// 	var name = feature.properties.NAMELSAD10;
// 	//name = name.replace(/city|town|village/gi,'');
// 	name = name.split(' ').splice(0,name.split(' ').length - 1).join();

// 	var labelLocation = new L.LatLng(lng,lat);
// 	var labelTitle = new L.LabelOverlay(labelLocation,'<div style="font-weight:bold">'+name+'</div>');
// 	//city_label_layers.addLayer(labelTitle); 
// 	map.addLayer(city_label_layers);

// 	layer.bindLabel(feature.properties.NAMELSAD10, {noHide:true});
// 	layer.on({
//             mouseover: highlightFeatureTown,
//             mouseout: resetHighlightTown,
// 	});
//     }

//     geojson = L.geoJson(wisc_counties,{
// 	style:myStyle,
// 	onEachFeature: onEachFeature
//     }).addTo(map);

//     map.addLayer(county_label_layers);

//     map.on('moveend', function () {
// 	    if (map.getZoom() >= 9 && map.hasLayer(geojson)) {
// 		//geoJson.setStyle();
// 	    }
// 	    if (map.getZoom() >= 9 && !map.hasLayer(ggl)) {
// 	       map.addLayer(ggl);
// 	    }
// 	    if (map.getZoom() < 9 && map.hasLayer(ggl)==false) {
// 	       map.removeLayer(ggl);
// 	    }
//     });

//     function get_towns_by_county_id(county_id){
// 	var towns_filtered = wisc_towns.features.filter(
// 	    function(e){
// 		if(e.properties['GEOID10'].substr(2,3) == county_id){
// 		    return true;
// 		} else {
// 		    return false;
// 		}
// 	    }
// 	);
// 	return {
// 	    type: "FeatureCollection",
// 	    features:towns_filtered
// 	};
//     }

//     ter = get_towns_by_county_id('037');
//     function add_town_layer(e){
// 	var county_id = e.target.feature.properties.COUNTY;
// 	var town_geojson = get_towns_by_county_id(county_id);
// 	town_layer = L.geoJson(town_geojson,{
//     	    style:myStyle,
// 	    onEachFeature: onEachFeatureTown
// 	}).addTo(map);	
//     }
// });

// 
