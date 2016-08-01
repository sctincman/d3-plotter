/* This function takes a D3 selection and generates a chart,
 * returning it as a closure in its update function,
 * much like proposed here (http://bost.ocks.org/mike/chart/)
 * This function assumes an svg container and will store the whole
 * chart in it's own group under the parent selection passed.
 * Parameters for configuration...
 * Width/Height as getter/setter functions. Defaults to size of parent group
*/

/* Configuration. Pass data in as either a single array of [x,y] points,
 * or as an array of JSON objects. The JSON object allows fine tuning:
 * {
 *     "data": [[x1,y1], ...,[xn,yn]], //necessary
 *     "attr": {                       //optional, attr of parent group for this data
 *       "attr1": "value",
 *       ...             ,
 *       "attrn": "value"
 *       }
 *     "presentations": [rep1, rep2, ..., rep3], //how to show data, JSON object
 *                                                 //optional, defaults to line+circles
 * }
 *
 * Passing in just data does a single line+points plot of the data using
 * the class "data" from the parent group. In all cases, try to use sane/aesthetic
 * defaults: group all elements into sensible groups, class all groups
 *
 * // Data "presentation" JSON format
 * {
 *     "element": (any valid SVG element)
 *     "attr": {...}  // list of attr for element
 *     "style": {...} //manual style for element
 *     "stagger" : ?? //not implemented yet, allow stagger/stacking of data
 *                    //This is typically good for CV data in papers.
 *     //path attributes, x and y
 *     "path": {...}
 * }
 * Try to use sane defaults, eg for circle use cx=xscale, cy=yscale, r=constant.
 * But, attr should allow override using anonymous functions.
 * { "attr": { "r" = function(d) {return d} }} to make circles scale radius 
 *
 * GOAL: Easy to use, easy to tweak/extend, easy to reuse for new data
 * so, 2/3?
*/

function clamp(input, low, high) {
    if (input < low)
	return low;
    else if (input > high)
	return high;
    else
	return input;
}

function lineChart(parentSelection, thedata){
    var parentGroup = parentSelection.append("g");

    //the group to hold all of our data
    var chartGroup = parentGroup
	.append("g")
	.attr("class", "d3-chart");

    // ugh, not sure what the best approach is here, copy objects/arrays?
    // store new groups in json objects? (if not copied, mutates passed object...)
    if (!Array.isArray(thedata)) thedata = [thedata];

    // JSON-ify the data if just an array of points, leaving original untouched
    // this prevents further config, only changing of data, add a getter?
    if (Array.isArray(thedata[0])) thedata = [{ "data": thedata}];

    //d3 selction is 2d array
    var width = parentSelection._groups[0][0].clientWidth;
    var height = parentSelection._groups[0][0].clientHeight;

    //redo scales, iterate all data and find maxs and mins
    var xScale = d3.scaleLinear();
    var yScale = d3.scaleLinear();

    //want axis on top, add last
    var xaxis = d3.axisBottom(xScale);
    var yaxis = d3.axisLeft(yScale);

    var axisgroup = parentGroup.append("g")
	.attr("class", "axes");
    var xaxisgroup = axisgroup.append("g")
	.attr("class", "x-axis")
    var yaxisgroup = axisgroup.append("g")
	.attr("class", "y-axis")

    var xpad=20, ypad=20;

    return function update(){
	xScale
	    .domain([thedata[0].data[0][0], thedata[0].data[thedata[0].data.length-1][0]])
	    .range([0, (width-(2*xpad))]);
	yScale
	    .domain([d3.min(thedata, function(d) { return d3.min(d.data, function(d) {return d[1]}) } ), 
		     d3.max(thedata, function(d) { return d3.max(d.data, function(d) {return d[1]}) } )])
	    .range([(height), (2*ypad)]); //invert y-axis to right-hand coordinate system

	thedata.forEach(function(dataObject) {
	    if (!dataObject.group) {
		dataObject.group = chartGroup.append("g").attr("class", "chart-area");
		dataObject.visible = true;
	    }
	    //make sure data is sorted by x value (needed by path)
	    dataObject.data.sort(function(a,b){return a[0] - b[0]});

	    if (dataObject.attr) {
		for (var attrKey in dataObject.attr) {
		    //apply attr specified in configuration object
		    dataObject.group.attr(attrKey, dataObject.attr[attrKey]);
		}
	    }

	    if (!dataObject.presentations) {
		dataObject.presentations = [
		    { "element" : "circle" },
		    { "element" : "path" }
		];
	    }

	    dataObject.presentations.forEach(function(present) {
		if (!present.group) present.group =
		    dataObject.group.append("g")
		    .attr("class", "chart-series");

		if (present.element == "path") {
		    if (!present.selection) present.selection = present.group.append("path");
		    if (!present.line) present.line = d3.line();
		    present.line.x(function(d) { return xScale(d[0]) });
		    present.line.y(function(d) { return yScale(d[1]) });
		    if (dataObject.visible) {
			present.selection.transition()
			    .attr("d", present.line(dataObject.data));
		    } else {
			present.selection.attr("d", present.line([[0,0]]));
		    }
		}
		else {
		    if (dataObject.visible) {
			present.dataSelection = present.group.selectAll(present.element)
			    .data(dataObject.data);
		    } else {
			present.dataSelection = present.group.selectAll(present.element)
			    .data([]);
		    }
		    switch(present.element) {
		    case "ellipse":
			present.dataSelection.enter().append(present.element)
			    .attr("rx", 0)
			    .attr("ry", 0)
			    .attr("cx", xScale(0))
			    .attr("cy", yScale(0));
			present.dataSelection.transition()
			    .attr("rx", 5)
			    .attr("ry", 4)
			    .attr("cx", function(d) { return xScale(d[0]) })
			    .attr("cy", function(d) { return yScale(d[1]) });
			present.dataSelection
			    .exit().transition().attr("ry", 0).attr("rx", 0)
			    .remove(present.element);
			break;
		    case "circle":
			present.dataSelection.enter().append(present.element)
			    .attr("r", 0)
			    .attr("cx", function(d) { return xScale(d[0]) })
			    .attr("cy", function(d) { return yScale(d[1]) })
			    .transition().attr("r", 4);
			present.dataSelection.transition()
			    .attr("cx", function(d) { return xScale(d[0]) })
			    .attr("cy", function(d) { return yScale(d[1]) })
			    .attr("r", 4);
			present.dataSelection
			    .exit().transition().attr("r", 0)
			    .remove(present.element);
			break;
		    case "rect":
			present.dataSelection.enter().append(present.element)
			    .attr("x", xScale(0))
			    .attr("y", yScale(0))
			    .attr("height", 0)
			    .attr("width", 0);
			present.dataSelection.transition()
			    .attr("x", function(d) { return xScale(d[0]) })
			    .attr("y", function(d) { return yScale(d[1]) })
			    .attr("height", 4)
			    .attr("width", 4);
			present.dataSelection
			    .exit().transition().attr("width", 0).attr("height", 0)
			    .remove(present.element);
			break;
		    default:
			console.warn("chart: unrecognized element, " + present.element);
		   }
		}
	    })
	});

	xaxis.scale(xScale);
	yaxis.scale(yScale);

	xaxisgroup.transition().call(xaxis);
	yaxisgroup.transition().call(yaxis);

	//fit on screen
	xpad = Math.ceil(yaxisgroup._groups[0][0].getBoundingClientRect().width);
	ypad = Math.ceil(xaxisgroup._groups[0][0].getBoundingClientRect().height);
	/* I contemplated reducing this to a transform on the parent group+axis
	 * However, then that would clobber any transform that the client applies
	 */
	xaxisgroup.transition().attr("transform", "translate("+xpad+", "+(clamp(yScale(0),0+ypad,height)-ypad)+")")
	yaxisgroup.transition().attr("transform", "translate("+(clamp(xScale(0), 0, width-xpad)+xpad)+", -"+ypad+")");
	chartGroup.transition().attr("transform", "translate("+xpad+", -"+ypad+")");

    }
};
