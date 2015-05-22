window.gmd = {
	//keep configurations crap out of intereact map
	pointMarkerUrl: function(){
		//return (window.g.jsBaseUrl() + '/images/icon-map-new-small.png');
	},
	cartoSqlConfig: new cartodb.SQL({
    	user: 'devtest', // Required
    	type: 'cartodb', // Required
    	host: 'anonymoustransaction.com:8080',
    	version: 'v1',
    	port:'8080',
    	protocol: 'http',
    	type: 'get',
		dataType: 'json',
		crossDomain: true
	}),
	cartoLayerConfig: function(sql, styles){

		var layerConfig = {
	    	user_name: 'devtest', // Required
	    	type: 'cartodb', // Required
	    	tiler_domain: 'anonymoustransaction.com',
	    	tiler_port:     "8181",
	    	tiler_protocol: 'http',
	    	sublayers: [{
	        	sql: sql, // Required
	        	cartocss: styles
	        	//interactivity: 'cartodb_id, the_geom, acreage, id, created_at'
	    	}]
	  	};

	  	return layerConfig;

	},
	interactMap: {
		panToPosition: function(iconType, latMap, lngMap){
			/*
			var jacksonCounty = new google.maps.LatLng(latMap, lngMap);
			var marker = new google.maps.Marker({
			    position: jacksonCounty,
			    icon: window.gmd.pointMarkerUrl(),
			    map: window.map,
			    title: 'Hello World!'
			});
			window.map.panTo(jacksonCounty);
			*/
			if (iconType == 'blueMarker'){
				var currentIcon = L.icon({
				    iconUrl: window.g.jsBaseUrl() + '/images/icon-map-new-small.png',
				});
			}
			if (iconType == 'tree'){
				var currentIcon = L.icon({
				    iconUrl: window.g.jsBaseUrl() + '/images/leaf-green.png',
				    shadowUrl: window.g.jsBaseUrl() + '/images/leaf-shadow.png',

				    iconSize:     [38, 95], // size of the icon
				    shadowSize:   [50, 64], // size of the shadow
				    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
				    shadowAnchor: [4, 62],  // the same for the shadow
				    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
				});
			}
			L.marker([latMap, lngMap], {icon: currentIcon}).addTo(window.map);
		
			setTimeout(function(){ 
		  		window.map.panTo(new L.LatLng(latMap, lngMap));
		  	}, 500);
		},
		//this is temporary, and ugly 
		addressLookup: function(address){
			var holdThis = this;
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode( { 'address': address}, function(results, status) {
			  if (status == google.maps.GeocoderStatus.OK)
			  {
			      
			      $('#latMap').val(results[0].geometry.location.lat());
			      $('#lngMap').val(results[0].geometry.location.lng());
			      $('#search-click').click();
			      
			      //console.log(lat);
			      //var lng = results[0].geometry.location.B;
			      //console.log(lng);
			      //holdThis.panToPosition (lat, lng);
			      
			  } else {
			  	alert('Sorry, looks like we could not find that address');
			  }
			});
		},
		queryAndPanToBounds: function(map, query) {
			//window.gmd.cartoSqlConfig
			window.gmd.cartoSqlConfig.getBounds(query).done(function(bounds) {
	       		map.fitBounds(bounds);
	       		console.log('BOUNDS')
	       		console.log(bounds);
	       });

		},
		nestedMap: function(){

			var thisScoped = this;
			
			//instantiate map
			window.nestedMap = L.map('nested-map', { 
	          zoomControl: true,
	          center: new L.LatLng(window.infoWindowLat, window.infoWindowLng),
	          zoom: 15,
	          infoWindow: true
	        });

	        var ggl1 = new L.Google('TERRAIN');
	        var ggl2 = new L.Google('HYBRID');
	        window.nestedMap.addLayer(ggl2);
	        window.nestedMap.addControl(new L.Control.Layers( {'Google Satelite':ggl2, 'Google Terrain':ggl1}, {}));

	        var customAccountString = window.g.mapConfig.nestedMapColumnName + ' = ' + window.g.mapRowData.queryVal;
			//console.log(customAccountString);
	        var sql = "SELECT * FROM douglas83feet WHERE " + customAccountString;
	        var styles = '#douglas83feet {polygon-fill: #0D6A92; polygon-opacity: 0.0; line-color: #8a0002; line-width: 2; line-opacity: 1;}';
			var LayerConfig = window.gmd.cartoLayerConfig(sql, styles);

			cartodb.createLayer(window.nestedMap, LayerConfig)
	         .addTo(window.nestedMap)
	         .on('done', function(layer) {
	           thisScoped.queryAndPanToBounds(window.nestedMap, sql);
	          }).on('error', function() {
	            console.log("some error occurred");
	        });
	        
	        setTimeout(function(){ 
        		$(window).trigger('resize');
        		window.nestedMap.invalidateSize(true);
        	}, 700);

		}
	},
	onClickTileManager: function(e, latlng, pos, data, layerNumber){
		window.infoWindowLat = latlng[0];
		window.infoWindowLng = latlng[1];
	

	  	var row = window.translations[window.g.mapConfig.countyNameConcat].translate(data);
	  	console.log(row);

	    if (row['ownerName']){
	    	var feeOwner = row['ownerName'];
	    } else {
	    	var feeOwner = 'unavailable';
	    }
	    if (row['acreage']){
	    	var acreage = row['acreage'];
	    } else {
	    	var acreage = 'unavailable';
	    }
	    if (row['totalValue']){
	    	var totalValue = this.sanatizeTotalValue(row['totalValue']);
	    }
	  
	    var infoWindowHtml;
	    infoWindowHtml = "<div><h5>" + feeOwner + "</h5>";
  		infoWindowHtml += "<div style='padding:10px;'><b>Acreage: </b>" + acreage + "<br/>";
  		infoWindowHtml += "<b>Total Value: </b>$" + totalValue + "</div>";
  		infoWindowHtml += "<a href='javascript:void(0);' onclick='leftPainOpenFromInfoWindow()' class='btn btn-primary left-open pull-right' style='color:white;'>Full Information</a>";
  		infoWindowHtml += "</div>";

  		console.log(infoWindowHtml);
	    
		setTimeout(function(){
			$( '.cartodb-popup-content' ).html(infoWindowHtml);
		}, 500);

	    window.g.mapRowData = row;
	    window.g.mapRowData.lat = window.infoWindowLat;
	    window.g.mapRowData.lng = window.infoWindowLng;
	    window.g.mapRowData.accountOwnerName = window.g.mapConfig.accountOwnerName;
	    window.g.mapRowData.accountOwnerPhone = window.g.mapConfig.accountOwnerPhone;
	    window.g.mapRowData.countyName = window.g.mapConfig.countyName;
	},

	sanatizeTotalValue: function(value){
		if (value){
	    	var currencyParse =  value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
	    	var splitNum = currencyParse.split(".");
	    	return splitNum[0];
		} else {
			return 'EMPTY';
		}
	},

	//this guy is now the main function
	populateMapAfterTimeout: function(){
        
        var thisScoped = this;

        var sql = "SELECT * FROM douglas83feet"
	    var styles = '#douglas83feet {polygon-fill: #0D6A92; polygon-opacity: 0.5; line-color: #FFF; line-width: 1; line-opacity: 1;}'
		var LayerConfig = window.gmd.cartoLayerConfig(sql, styles);

		cartodb.createLayer(window.map, LayerConfig)
         .addTo(window.map)
         .on('done', function(layer) {
           var infowindow_model = layer.getSubLayer(0).infowindow;
           // get sublayer 0 and set the infowindow template
           var sublayer = layer.getSubLayer(0);
            sublayer.setInteraction(true);          
          
            layer.getSubLayer(0).set('template', $('#infowindow_template').html())
            .on('error', function(err){
              console.log('infowindow error: ', err);
            });
           
            sublayer.infowindow.set('template', $('#infowindow_template').html());

            sublayer.on('featureClick', function(e, latlng, pos, data, layerNumber) {
                  //alert("Hey! You clicked " + data.cartodb_id);
                  //console.log(pos);
                  console.log('latlng');
                  console.log(latlng);
                  console.log(data);
                  infowindow_model.set('visibility', true);
                  console.log(infowindow_model);
    			  console.log(window.translations[window.g.mapConfig.countyNameConcat + 'Map']);
                  
                  thisScoped.onClickTileManager(e, latlng, pos, data, layerNumber);

            });

            //lets keep this commented out for now
            //sublayer.on('featureOver', function(e, latlng, pos, data, layerNumber) {
           	//});

            var configurationArray = window.translations[window.g.mapConfig.countyNameConcat + 'Map'];
            console.log(configurationArray);
            cdb.vis.Vis.addInfowindow(window.map, layer.getSubLayer(0), configurationArray, {'infowindowTemplate': $('#infowindow_template').html(), 'templateType': 'mustache'})

          }).on('error', function() {
            console.log("some error occurred");
        });
    },

    //this is our entry point to the map
	populateMap : function (latMap, lngMap){
		var thisScoped = this;

		var poly;
		window.map;
		var marker;
		var markers = [];
		var initialMakerPoint;
		var masterCount = 0;
		var masterLatLng;
		var infowindow = null;
		var jacksonCounty = new google.maps.LatLng(latMap, lngMap);


	    setTimeout(function(){
	    	window.map = L.map('map-canvas', { 
	          zoomControl: true,
	          center: new L.LatLng(latMap, lngMap),
	          zoom: 13,
	          infoWindow: true
	        });

	        //var ggl2 = new L.Google('TERRAIN');
	        var ggl2 = new L.Google('HYBRID');
        	window.map.addLayer(ggl2);
	    	/*
	    	window.map = new google.maps.Map(document.getElementById('map-canvas'), {
				center: jacksonCounty,
				zoom: 16,
				mapTypeId: google.maps.MapTypeId.HYBRID
			});
	    	
			var marker = new google.maps.Marker({
			    position: jacksonCounty,
			    map: window.map,
			    icon: window.gmd.pointMarkerUrl(),
			    title: 'Hello World!'
			});
			*/

	    	thisScoped.populateMapAfterTimeout();
	    	//this should go below
	   		$( ".dash-center" ).show();
	   		$( ".options-inter-margin" ).show();
	   		$( ".dash-left-inter-margin" ).show();
	   		$( ".dash-right-inter-margin" ).show();

		},1300);
	}
};