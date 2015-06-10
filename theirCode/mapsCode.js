var hh;
var ll;
var vv;
readcsv();
//reading csv file
function readcsv(){
    $.ajax({
        type: "GET",
        url: "tmp/data.csv",
        dataType: "text",
        success: function(data) {processData(data);}
     });
}

//processing csv data
function processData(allText) {
	// sanitize data. on basis of vertical spaces, split data into rows
    var allTextLines = allText.split(/\r\n|\n/);
	
	// split the first row to get the header
    hh = allTextLines[0].split(',');
    
	// TOKNOW
	ll=[];
    vv=[];

	// for every line of the data
    for (var i=1; i<allTextLines.length; i++) {
		// get data from line
        var data = allTextLines[i].split(',');
		
		// match data length with header length
        if (data.length == hh.length) {
            var tarr = [];
            for (var j=0; j<hh.length; j++) {
            	if(j !=0 ){
	                data[j]=parseFloat(data[j]);            		
            	}
                tarr.push(data[j]);
            }
			// push row as array into the table as array.
            ll.push(tarr);
        }
    }

	// for each column in data
    for(var i=0; i<hh.length; i++){
        var temp=[];
		// for each row in the data
        for(var j=0; j<ll.length; j++){
			// put data in one array
            temp.push(ll[j][i]);
        }
		// push the array into all data compilation
        vv.push(temp);
    }
    cmap();
}

//choropleth function for states
function cmap(){
    var headers=[];
    var lines=[];
    var values=[];

	// overdone. _> headers = hh; was enough
    for(var i=0;i<hh.length;i++){
        headers.push(hh[i]);
    }
	
	// overdone. _> lines. no processing done; should have just said _> lines = ll;
	for(var i=0;i<ll.length;i++){
        var temp=[];
		// for every column
        for(var j=0;j<ll[i].length;j++){
			// push every element in the array
			// overDONE. _> line.push(ll[i]); was enough
            temp.push(ll[i][j]);
        }
		// got all the lines of data. 
        lines.push(temp);
    }
	
	// same as _> values = vv;
    for(var i=0;i<vv.length;i++){
        var temp=[];
        for(var j=0;j<vv[i].length;j++){
            temp.push(vv[i][j]);
        }
        values.push(temp);
    }
	
	
    var width = 960,
        height = width/2,
		
		// to convert the number into string
        formatPercent = d3.format(".0%"),
        formatNumber = d3.format(".0f");

	
    active = d3.select(null);

	
    var threshold = d3.scale.threshold()
        .domain([.2, .3, .4, .5, .6, .7, .8, .9, 1])
        .range(["#F7FBFF", "#DEEBF7", "#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]);

    var aspect = 960 / 500,
        chart = $("#chart");

		
	// resize the chart as the window resizes. should use the window
    $(window).on("resize", function() {
        var targetWidth = chart.parent().width();
        chart.attr("width", targetWidth);
        chart.attr("height", targetWidth / aspect);
    });

	
	// height width and on click call stopped() function
    var svg = d3.select("#chart")
        .attr("width", width)
        .attr("height", height)
        .on("click", stopped, true);

	// COMMENT: another svg, lets see for what
    var svg1 = d3.select("#chart1")
        .attr("width", width)
        .attr("height", 60)
        .on("click", stopped, true);

	// create range based color scale for values of percentages
    var colors = d3.scale.quantize()
      .domain([0, 100])
      .range(colorbrewer.RdYlGn[11]);

	// COMMENT: group added to svg1
    var g = svg1.append("g")
        .attr("class", "key")
        .attr("transform", "translate(50,40)");

	// creating scale for using with x axis, 240 pixel wide, thats why using 240 as range limit.
    var x = d3.scale.linear()
        .domain([0, 1])
        .range([0, 240]);
	
	// COMMENT: cannto understand the tickSize, tickValues and tickFormat logic as of now. why 13? 
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(13)
        .tickValues(threshold.domain())
        .tickFormat(function(d) { return d === .5 ? formatPercent(d) : formatNumber(100 * d); });

	// create key's colored boxes with range definitions
    g.selectAll("rect")
        .data(threshold.range().map(function(color) {
          var d = threshold.invertExtent(color);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
        .enter().append("rect")
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("x", function(d) { return x(d[0]); })
        .attr("height", 12)
        .style("fill", function(d) { return colors(d[0]*100); });

	// 
	// text, y, and class - should be taken in as variable
    g.call(xAxis).append("text")
        .attr("class", "caption")
        .attr("y", -16)
        .text("Percentage (%)");

    var g = svg.append("g");

    var rateById = d3.map();

    var quantize = d3.scale.quantize()
        .domain([0, 100])
        .range(d3.range(9).map(function(i) { return "states q" + i + "-9"; }));

	// no behavior for zoom out
   var zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    svg.call(zoom) // delete this line to disable free zooming
        .call(zoom.event);

    var path;

    var tooltip = d3.select("#show_graph").append("div")
        .attr("class", "tooltip");

    queue()
        .defer(d3.json, "files/states.json")
        .await(ready);

	
    function ready(error, us) {
        for(var i=0; i<lines.length; i++){
                rateById.set(lines[i][0], +lines[i][1]);
        }

        var center = d3.geo.centroid(topojson.feature(us, us.objects.output));
        var scale  = 150;
        var offset = [width/2, height/2];
        var projection = d3.geo.mercator().scale(scale).center(center)
            .translate(offset);

        // create the path
        path = d3.geo.path().projection(projection);

        // using the path determine the bounds of the current map and use 
        // these to determine better values for the scale and translation
        var bounds  = path.bounds(topojson.feature(us, us.objects.output));
        var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
        var vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
        var scale   = (hscale < vscale) ? hscale : vscale;
        var offset  = [width - (bounds[0][0] + bounds[1][0])/2,
            height - (bounds[0][1] + bounds[1][1])/2];

        // new projection
        projection = d3.geo.mercator().center(center)
            .scale(scale).translate(offset);
        path = path.projection(projection);

        // add a rectangle to see the bound of the svg
        g.append("rect")
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .on("click", reset);

        g.selectAll("path").data(topojson.feature(us, us.objects.output).features).enter().append("path")
            .attr("d", path)
            .attr("val",function(d){return rateById.get(d.properties.id)})
            .style("fill",function(d){ return colors(rateById.get(d.properties.id));})
            .style("stroke-width", "1")
            .style("stroke", "black")
            .on("click", clicked)
            .on("mousemove", function(d,i) {
                var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
                tooltip
                  .classed("hidden", false)
                  .attr("style", "left:"+(mouse[0]+50)+"px;top:"+(mouse[1]+70)+"px;font-size:14px;")
                  .html(d.properties.name + " - <strong>" + rateById.get(d.properties.id)+"%</strong>")
              })
              .on("mouseout",  function(d,i) {
                tooltip.classed("hidden", true)
              });
    }

    function clicked(d) {
      if (active.node() === this) return reset();
      active.classed("active", false);
      active = d3.select(this).classed("active", true);

      var bounds = path.bounds(d),
          dx = bounds[1][0] - bounds[0][0],
          dy = bounds[1][1] - bounds[0][1],
          x = (bounds[0][0] + bounds[1][0]) / 2,
          y = (bounds[0][1] + bounds[1][1]) / 2,
          scale = .9 / Math.max(dx / width, dy / height),
          translate = [width / 2 - scale * x, height / 2 - scale * y];

      svg.transition()
          .duration(750)
          .call(zoom.translate(translate).scale(scale).event);
    }

    function reset() {
      active.classed("active", false);
      active = d3.select(null);

      svg.transition()
          .duration(750)
          .call(zoom.translate([0, 0]).scale(1).event);
    }

    function zoomed() {
      g.style("stroke-width", 0.1 / d3.event.scale + "px");
      g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // If the drag behavior prevents the default click,
    // also stop propagation so we don’t click-to-zoom.
    function stopped() {
      if (d3.event.defaultPrevented) d3.event.stopPropagation();
    }
}