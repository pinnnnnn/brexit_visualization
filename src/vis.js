/*  This file is part of The Brexit Demographic Visualization.

    The Brexit Demographic Visualization is free software: you can
    redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    The Brexit Demographic Visualization is distributed in the hope that it
    will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with The Brexit Demographic Visualization. If not, see
    <http://www.gnu.org/licenses/>. */

// Define dimensions for visualization for the svgs.
var width  = 600;
var height = 700;
var centered = null;

/* Set up a projection for England which is centered and
 * scaled appropriately. */
var projection = d3.geoAlbers()
    .center([1, 55.8])
    .rotate([4.6, 0])
    .parallels([50, 60])
    .scale(1200 * 5)
    .translate([width / 2.75, height / 16]);

// Create the geoPath for the projection of England
var path = d3.geoPath().projection(projection);

// Add an SVG to display the demographic data
var svgLeft = d3.select("#mapLeft").append("svg")
    .attr('id', 'svgLeft')
    .attr("width", width)
    .attr("height", height);

// Add an SVG to display the Brexit voting data
var svgRight = d3.select("#mapRight").append('svg')
    .attr('id', 'svgRight')
    .attr('width', width)
    .attr('height', height);

/* Add an SVG to display detailed statistics about a
 * specific local-area district. */
var svgStats = d3.select('#lad-statistics').append('svg')
    .attr('id', 'svgStats')
    .attr('width', width)
    .attr('height', height);

// Placeholder for the parsed topojson file.
var ukTopojson = undefined;

// Placeholder for the parsed voting data.
var brexitData = undefined;

// Keep track of demographic data.
var demographicData = d3.map();

// Use this table as frequently as possible when performing operations over all datasets.
var demographic_ids = [{ value: "cob", name: "Region of Birth", colorArr: ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'] },
                       { value: "eth", name: "Ethnic Group", colorArr: ['#f7fcfd','#e0ecf4','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b'] },
                       { value: "hpu", name: "Health and Provisions", colorArr: ['#f7fcf0','#e0f3db','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3','#2b8cbe','#08589e'] },
                       { value: "huw", name: "Hours Worked", colorArr: ['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#990000']  },
                       { value: "isx", name: "Industry", colorArr: ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'] },
                       { value: "lva", name: "Living Arrangements", colorArr: ['#fff7fb','#ece2f0','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016450'] },
                       { value: "mla", name: "Main Language", colorArr: ['#f7f4f9','#e7e1ef','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#91003f'] },
                       { value: "nid", name: "National Identity", colorArr: ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177'] },
                       { value: "qus", name: "Qualifications and Students", colorArr: ['#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#005a32'] },
                       { value: "rel", name: "Religion", colorArr: ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84'] },
                       { value: "ten", name: "Tenure", colorArr: ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#8c2d04'] },
                       { value: "pop", name: "Resident Population", colorArr: ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'] },
                       { value: "hhc", name: "Household Composition", colorArr: ['#fafafa','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525'] }];

// Define tooltip div for hovering
var tooltip = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

// Create demographic options for left map
d3.selectAll('#demographic').selectAll('option')
    .data(demographic_ids)
    .enter()
    .append('option')
    .attr('value', d => d.value)
    .text(d => d.name);

/* Event handler to handle changes in demographic choice. Upon a change
 * in the selection the subcategory selector will be populated with the
 * appropriate options. */
d3.select('#demographic')
    .on('change', function() {
        updateDemographicView(d3.select(this).node().value);
    });

/* Event handler to handle changes in subcategory of the chosen demographic.
 * Upon a change in the selection the left-most map will be populated with
 * the data of the chosen subcategory. */
d3.select('#subcategory')
    .on('change', function() {
        updateSubcategoryView(d3.select('#demographic').node().value, // Demographic value update
                              d3.select(this).node().value);
    });

/* Event handler to handle changes in whether to display the "leave" votes
 * as blue or to display the "remain" votes as blue. */
d3.select('#brexit')
    .on('change', function() {
        updateBrexitView(brexitData, d3.select(this).node().value);
    });

/* Popup for tutorial and help features */
$(document).ready(function() {
    $('.about-popup').magnificPopup({
	type:'inline',
	midClick: true
    });
    $('.glossary-popup').magnificPopup({
	type:'inline',
	midClick: true
    });
});

d3.select('#about').append


// Queue a sequence of requests for parsing the data into the visualization.
var q = d3.queue();
q.defer(d3.json, '../data/uk.json')
    .defer(d3.csv, '../data/brexit/EU-referendum-result-data.csv')
    .defer(d3.csv, '../data/demographics/country_of_birth.csv')
    .defer(d3.csv, '../data/demographics/ethnic_group.csv')
    .defer(d3.csv, '../data/demographics/health_and_provision_of_unpaid_care.csv')
    .defer(d3.csv, '../data/demographics/hours_worked.csv')
    .defer(d3.csv, '../data/demographics/industry_by_sex.csv')
    .defer(d3.csv, '../data/demographics/living_arrangements.csv')
    .defer(d3.csv, '../data/demographics/main_language.csv')
    .defer(d3.csv, '../data/demographics/national_identity.csv')
    .defer(d3.csv, '../data/demographics/qualifications_and_students.csv')
    .defer(d3.csv, '../data/demographics/religion.csv')
    .defer(d3.csv, '../data/demographics/tenure.csv')
    .defer(d3.csv, '../data/demographics/usual_resident_population.csv')
    .defer(d3.csv, '../data/demographics/household_composition.csv')

// Parse all of the defered files within the d3 queue.
q.await(function(error, uk, brexit) {
    // Once all requests (currently only one) are complete, this function runs
    if (error) {
        console.error(error);
    }
    // Populate the placeholder with the parsed topojson information.
    ukTopojson = uk;

    // Populate the placeholder with the parsed Brexit voting data.
    brexitData = brexit;
    
    // If processes are deferred earlier in queue than csv's, change demographic_starting_id accordingly
    var demographic_starting_id = 3;
    
    /* Put the demographic data into a d3 map in which the key is the HTML
     * option value */
    for (var i = demographic_starting_id; i < arguments.length; i++) {// Start after brexit argument 
        demographicData.set(demographic_ids[i - demographic_starting_id].value, arguments[i]);
    }
    
    // Draw land (reformatted to generate lads by lad) for the left map.
    svgLeft.append('g')
	.attr('id', 'lad')
	.selectAll('path')
	.data(topojson.feature(uk, uk.objects.lad).features)
	.enter()
	.append('path')
	.attr('d', path)
    /* If the given district is clicked, resize the window to zoom in on the
     * district. */
	.on('click', LADClicked)
	.on('mouseover', function(d) {
	    tooltip.style("opacity", .9);		
            tooltip.text(d.properties.LAD13NM)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px")
		.style('font-weight', 'bold')
		.style('font-size', 18 + 'px');
	})
	.on('mouseout', tooltipHide);

    // Append the boundaries of each district to the left-most map
    svgLeft.append("path")
        .datum(topojson.mesh(uk, uk.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    // Draw land (reformatted to generate lads by lad) for the right map.
    svgRight.append('path')
        .datum(topojson.feature(uk, uk.objects.lad))
	.attr('class', 'land')
	.attr("d", path);

    // Append the boundaries of each district to the right-most map    
    svgRight.append("path")
        .datum(topojson.mesh(uk, uk.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);
    
    /* Force update upon loading the visualization for the first time.
     * Load the default demographic and voting data. */
    updateDemographicView(d3.select('#demographic').node().value);
    updateSubcategoryView(d3.select('#demographic').node().value,
                          d3.select('#subcategory').node().value);
    updateBrexitView(brexitData, d3.select('#brexit').node().value);
});

/* Function to update the options available to select as a demographic
 * subcategory. */
function updateDemographicView(d) {
    // Grab data for selected demographic view.
    var datum = demographicData.get(d);

    // Remove previous options for the subcategory.
    d3.selectAll('#subcategory').selectAll('option').remove();
    
    // Make array of options to be added.
    var options = [];
    for (option of Object.keys(datum[0])) {
        if (option != 'district' && option != 'total' && option != '%') {
            options.push(option);
        }
    }

    // Add subcategory select options.
    d3.selectAll('#subcategory').selectAll('option')
        .data(options)
        .enter()
        .append('option')
        .attr('value', d => d)
        .text(function (d) {
            if (d != 'district' && d != 'total' && d != '%') {
                return d;
            }
        });
}

/* Function to update the left-most map to display the data of the chosen
 * subcategory. */
function updateSubcategoryView(demographicOfChoice, subcategoryOfChoice) {
    /* Create a temporary hash map to store as the key the district name
     * and the value as the percentage of individuals with the selected
     * demographic within the associated district. */
    var tempMap = d3.map();

    // Retreive the demographic data from the array.
    var demographicArray = demographicData.get(demographicOfChoice);
    
    /* Iterate through each entry within the demographic data
     * and populate the hash map with the data for each district.
     * 
     * Additionally, compute the maximum and minimum for the chosen 
     * demographic. */
    var min = 1;
    var max = 0;
    for (var i of demographicArray) {
        var calc = +i[subcategoryOfChoice] / i['total'];
        tempMap.set(i.district, calc);
        if (calc < min) {
            min = calc;
        }
        if (calc > max) {
            max = calc;
        }
    }
    
    /* Generate the domain array by creating 8 equal subintervals.
     * This is necessary since the color scheme involves 8 colors. d3 is stupid. */
    var domain = [];
    var range = max - min;
    var step = range / 7;
    for (var i = 0; i < 8; i++) {
        domain.push(min + (step * i));
    }

    /* Create the color scale for the color filling of each district based
     * on the percentage for the district. */
    var colorScale = d3.scaleLinear()
	.range(demographic_ids.find(d => d.value === demographicOfChoice).colorArr)
	.domain(domain);
    
    // Remove all previous fillings for the districts.
    svgLeft.selectAll('g').remove();
    svgLeft.selectAll('path.lad-boundary').remove();

    /* Create the districts according to the topojson and color
     * them appropriately according to the color scale. Furthermore,
     * allow for the user to click on a district and have the window zoom in. */
    svgLeft.append('g')
        .attr('class', 'districts')
        .selectAll('path')
        .data(topojson.feature(ukTopojson, ukTopojson.objects.lad).features)
        .enter()
        .append('path')
        .attr('fill', function(d) {
            return colorScale(tempMap.get(d.properties.LAD13NM));
        })
        .attr('d', path)
    	.on('click', LADClicked)
	.on('mouseover', function(d) {
	    tooltip.style("opacity", .9);		
            tooltip.text(d.properties.LAD13NM + ': ' +
			 Math.round(100 * tempMap.get(d.properties.LAD13NM)) + '%')	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px")
		.style('font-weight', 'bold')
		.style('font-size', 18 + 'px');
	})
	.on('mouseout', tooltipHide);

    // Add the boundaries for each of the districts.
    svgLeft.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    // Create the legend for the chosen demographic.
    updateLegendScale(min, max, colorScale, subcategoryOfChoice, svgLeft, 7, 'Left');
}

/* Function that creates a legend for both the left and right maps depending
 * on which SVG is supplies as an argument. The legend will be a continuous
 * gradient whose colors will depend upon those within the range of colorScale. */
function updateLegendScale(min, max, colorScale, subcategoryOfChoice, svg, numInRange, name) {
    // Remove the previous legend and all its components.
    svg.selectAll('defs').remove();
    svg.selectAll('rect').remove();
    svg.selectAll('text').remove();
    svg.selectAll('g.legendWrapper').remove();
    
    /* Make the gradient.    
     * 
     * Citation: Inspiration and partial code retrieved from
     * https://bl.ocks.org/starcalibre/6cccfa843ed254aa0a0d */
    var gradient = svg.append('defs')
	.append('linearGradient')
	.attr('id', 'gradient' + name)
	.selectAll('stop')
	.data(colorScale.range())
	.enter()
	.append('stop')
	.attr("offset", function(d,i) { return i/(numInRange); })   
	.attr("stop-color", function(d) { return d; });

    // Define the dimensions for the legend based upon the SVG size (mostly).
    var legendWidth = width * 0.6;
    var legendHeight = 10;
    
    // Container to house the legend SVG within the current svg.
    var legendsvg = svg.append("g")
	.attr("class", "legendWrapper")
	.attr("transform", "translate(" + (width/2 - 10) + "," + (height * .93) + ")");
    
    // Draw the rectangle for the legend using the created gradient.
    legendsvg.append("rect")
	.attr("class", "legendRect")
	.attr("x", -legendWidth/2)
	.attr("y", 10)
    	.attr("width", legendWidth)
	.attr("height", legendHeight)
	.style("fill", 'url(#gradient' + name + ')');
    
    /* Append the title of the legend above based upon what subcategory was
     * chosen. */
    legendsvg.append("text")
	.attr("class", "legendTitle")
	.attr("x", 0)
	.attr("y", -2)
	.text(subcategoryOfChoice);
    
    // Set scale for x-axis for the legend.
    var xScale = d3.scaleLinear()
	.range([0, legendWidth])
	.domain([min, max]);
    
    // Define x-axis and format the tick marks.
    var xAxis = d3.axisBottom(xScale)
	.ticks(7, ',.1%');
    
    // Draw the x-axis for the legend to appear below the gradient.
    legendsvg.append("g")
	.attr("class", "axis")  // Assign "axis" class
	.attr("transform", "translate(" + (-legendWidth/2) + "," + (10 + legendHeight) + ")")
	.call(xAxis);
}

/* Function to update the right-most map to represent the user's desire to
 * have the more "remain" leaning district to be blue or vice versa. */
function updateBrexitView(demo, d) {
    // Make a color scale for remain/leave votes
    var colorScaleVotes = d3.scalePow()
        .exponent(1/3)
        .range(['#ef8a62', '#fff', '#67a9cf']);

    // Placeholder variable for the parsed percentage.
    var pct = undefined;

    /* Construct a hash map to store as the key the district name and
     * the value as the percentage. */
    var votes = d3.map();

    /* Iterate over the districts of the Brexit voting data and populate
     * the hash map that was defined above. */
    for (var row of demo) {
        if (d == 'Leave') {
            pct = parseInt(row.Pct_Leave);
        } else if (d == 'Remain') {
            pct = parseInt(row.Pct_Remain);
        }
        if (pct != 0) {
            // Use negative percentages to define the opposite vote.
            votes.set(row.Area_Code, (pct - 50)/100);
        }
    }

    // Calculate the minimum and maximum vote percentages.
    var minVote = d3.min(votes.values());
    var maxVote = d3.max(votes.values());

    // Compute the maximum and minimum for the legend for remain/leave votes.
    var legendMaxVotes = Math.max(Math.abs(minVote), maxVote);
    var legendMinVotes = -legendMaxVotes;

    // Set the domain of the color scale for the votes.
    colorScaleVotes.domain([legendMinVotes, 0, legendMaxVotes]);

    // Create a scale for the legend of remain/stay votes.
    var legendVoteScale = d3.scaleLinear()
        .domain([0,8])
        .range([legendMinVotes, legendMaxVotes]);

    // Add coloring for districts voting turnout.
    svgRight.append('g')
        .attr('class', 'districts')
        .selectAll('path')
        .data(topojson.feature(ukTopojson, ukTopojson.objects.lad).features)
        .enter()
        .append('path')
        .attr('fill', d => colorScaleVotes(votes.get(d.id)))
        .attr('d', path)
	.on('mouseover', function(d) {
	    tooltip.style("opacity", .9);		
            tooltip.text(d.properties.LAD13NM)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px")
		.style('font-weight', 'bold')
		.style('font-size', 18 + 'px');
	})
	.on('mouseout', tooltipHide);

    // Add district boundaries to the right-most map.
    svgRight.append("path")
        .datum(topojson.mesh(ukTopojson, ukTopojson.objects.lad,
                             function(a, b) { return a !== b; }))
        .attr("class", "lad-boundary")
        .attr("d", path);

    // Create the legend for the right-most map.
    updateLegendScale(legendMinVotes, legendMaxVotes, colorScaleVotes,
		      'Percentage of Votes in Referendum', svgRight, 2, 'Right');
}

/* Function which will zoom in on the district when clicked. This function
 * is called when a district is clicked and will supply that district as
 * an argument. */
function LADClicked(district) { // Handles click and zoom
   // Citation: Code retrieved from https://bl.ocks.org/mbostock/2206590
    var x, y, k;
    
    if (district && centered !== district) {
	var centroid = path.centroid(district);
	x = centroid[0];
	y = centroid[1];
	k = 4;
	centered = district;
	// Change Brexit Map
	d3.select('#lad-statistics')
	    .style('z-index', 1)
	    .style('opacity', 1);
	d3.select('#mapRight')
	    .style('z-index', 0);
    } else {
	x = width / 2;
	y = height / 2;
	k = 1;
	centered = null;
	// Change Brexit Map
	d3.select('#lad-statistics')
	    .style('z-index', 0)
	    .style('opacity', 0);
	d3.select('#mapRight')
	    .style('z-index', 1);
    }
    
    svgLeft.selectAll("path")
	.classed("active", centered && function(d) { return d === centered; });
    
    svgLeft.transition()
	.duration(750)
	.attr("transform", "translate(" + width / 2 + "," + height / 2
	      + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1.5 / k + "px");

    updateStatsRight(district);
}

/* Function which will display the detailed district specific data
 * when the district is clicked. This will generate a bar chart which will
 * display all of the subcategory statistics of the given district as well
 * as the voting distribution for the district. */
function updateStatsRight(district) {
    /* Citation: Elegant bar chart code retrieved from
     * https://bl.ocks.org/mbostock/3885304 */

    /*****************************************
     ******* ADD DEMOGRAPHIC BAR CHART *******
     *****************************************/
    d3.select('#svgStats').selectAll('g').remove();

    var margin = {top: 50, right: 100, bottom: 200, left: 60};
        statsWidth  = width - margin.left - margin.right,
        statsHeight = height - margin.top - margin.bottom;
    
    // Retrieve the data corresponding to the selected demographic.
    var data = demographicData.get(d3.select('#demographic').node().value)
    
    /* Filter the data to only include the object which corresponds to the
     * clicked district. */
    var stats = data.find(d => d.district === district.properties.LAD13NM);

    // Define the arrays for the x and y axis data for the bar chart.
    var keys   = [];
    var values = [];

    // Iterate over the object for the district and populate the two arrays.
    for (var key in stats) {
        // Do not include the data from the district or total columns.
        if (key != 'district' && key != 'total') {
            keys.push(key);
            values.push(+stats[key]);
        }
    }
    
    /* Create two scales for creating the bar chart corresponding to the
     * x and y axes. */
    var x = d3.scaleBand().rangeRound([0, statsWidth]).padding(0.1)
        .domain(keys);
    var y = d3.scaleLinear().rangeRound([statsHeight, 0])
        .domain([0, d3.max(values)]);
    
    // Create the base 'g' element to put all of the bar chart elements into.
    var gDemo = svgStats.append("g")
	.attr('class', 'col-8')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Retrieve the color to fill the bars in.
    var barFill = demographic_ids.find(d => d.value === d3.select('#demographic').node().value).colorArr[4];

    // Draw the x-axis.
    var xAxis = d3.axisBottom(x);

    /* Position x-axis in the correct position and rotate the text slightly
     * for each of the tick labels. */
    gDemo.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + statsHeight + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(55)")
        .style("text-anchor", "start");

    // Append title to the bar chart.
    gDemo.append("text")
        .attr("x", (statsWidth / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")
	.text(demographic_ids.find(d => d.value === d3.select('#demographic').node().value).name
              + ' Statistics for ' + district.properties.LAD13NM);
    
    // Append the y-axis to the bar chart.
    gDemo.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");

    // Draw the bars of the bar chart.
    gDemo.selectAll(".bar")
        .data(values)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d, i) { return x(keys[i]); })
        .attr("y", function(d) { return y(d); })
	.style('fill', barFill)
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return statsHeight - y(d); })
	.on('mouseover', tooltipShow)
	.on('mouseout', tooltipHide);

    
    /*****************************************
     ******* ADD BREXIT VOTE BAR CHART *******
     *****************************************/

    // Retrieve the data for the clicked district.
    var brexitDataForDistrict = brexitData.find(d => d.Area === district.properties.LAD13NM);

    /* Filter the data to only contain the absolute number of votes for remain
     * and leave */
    var votingData = [brexitDataForDistrict.Remain, brexitDataForDistrict.Leave];

    /* Define the colors for the two bars depicting the voting breakdown within
     * the selected district */
    var brexitColors = [ '#ef8a62', '#67a9cf' ];

    // Create a scale for the y-axis of the voting split.
    var yBrexit = d3.scaleLinear().rangeRound([statsHeight, 0])
        .domain([0, brexitDataForDistrict.Valid_Votes]);

    // Create a SVG group object for the voting bars.
    var gBrexit = svgStats.append("g");

    // Create the y-axis for the voting bar chart.
    gBrexit.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", 'translate(' + (statsWidth + 100) + ', 50)')
        .call(d3.axisLeft(yBrexit).ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");

    // Create the bars for the stacked voting bar chart.
    gBrexit.selectAll('.bar')
        .data(votingData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', statsWidth + 110)
        .attr('y', function(d, i) { return i * (statsHeight - yBrexit(votingData[0])) + 50; })
        .style('fill', function(d,i) { return brexitColors[i]; })
	.style('stroke-width', '2px')
	.style('stroke', '#fff')
        .attr('width', 80)
        .attr('height', function(d,i) { return statsHeight - yBrexit(d); })
        .on('mouseover', tooltipShow)
        .on('mouseout', tooltipHide);

    // Add the title for the stacked bar chart representing the Brexit vote.
    gBrexit.append("text")
        .attr("x", statsWidth + 110)             
        .attr("y", 0 + (margin.top * 0.75))
        .attr("text-anchor", "middle")  
        .style("font-size", "10px") 
        .style("text-decoration", "underline")
	.text('Referendum Results');
}

/* Function to show a tool tip when the mouse hovers over either a district
 * or a bar. When hovering over a district the district name will be displayed
 * whereas the bar will show the value that is being displayed. */
function tooltipShow(d) {
    tooltip.style("opacity", .9);		
    tooltip.text(d)	
        .style("left", (d3.event.pageX) + "px")		
        .style("top", (d3.event.pageY - 28) + "px")
	.style('font-weight', 'bold')
	.style('font-size', 18 + 'px');
}

// Hide the tool tip when the mouse is no longer hovering over the object.
function tooltipHide(d) {
    tooltip.style("opacity", 0);	
}






