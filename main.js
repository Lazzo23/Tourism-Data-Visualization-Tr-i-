document.addEventListener('DOMContentLoaded', function () {

  // Line chart dimensions and margins
  var margin = {top: 30, right: 100, bottom: 30, left: 100},
  width = 1100 - margin.left - margin.right,
  height = 800 - margin.top - margin.bottom;
  
  // Append the svg object to the body of the page
  var svg = d3.select("#line-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Statistics
  const statistics = document.getElementById("statistics");

  // Prepare data for visualization
  function prepareData(data) {
    const headers = Object.values(data).toString().split(";");
    const countryNames = [];
    for (var i = 0; i < headers.length; i++) {
        countryNames.push(headers[i].replace(' Prihodi turistov','').slice(headers[i].indexOf(' ') + 1));
    }
    return data.reduce((result, item, i) => {
      const monthData = Object.values(item).toString().split(";");

      for (let j = 2; j < monthData.length; j += 2) {
        const arrivalsTmp = !isNaN(monthData[j]) ? parseInt(monthData[j]) : 0;
        const nightsTmp = !isNaN(monthData[j + 1]) ? parseInt(monthData[j + 1]) : 0;
      
      if (countryNames[j] != "Država - SKUPAJ" && countryNames[j] != "TUJI" && countryNames[j] != "DOMAČI")
        result.push({
            month: monthData[0],
            country: countryNames[j],
            arrivals: arrivalsTmp,
            nights: nightsTmp
        });
      }
      return result;
    }, []);
  }

  // Calculate basic statistics
  function calculateStatistics(Data, country) {
    const countryData = Data.filter(d => d.country==country)
    var allNights = countryData.reduce((accumulator, d) => accumulator + d.nights, 0);
    var allArrivals = countryData.reduce((accumulator, d) => accumulator + d.arrivals, 0);
    var avgNights = Math.round((allNights / allArrivals) * 100) / 100;
    var bestMonth = countryData.reduce(function(prev, current) {
      return (prev && prev.nights > current.nights) ? prev : current
    }); 
    statistics.innerHTML = 
    "<b>Skupno število prenočitev</b>: " + allNights + "<br>" +
    "<b>Skupno število turistov</b>: " + allArrivals + "\<br>" +
    "<b>Povprečno število prenočitev na turista</b>: " + avgNights + "<br>" +
    "<b>Najboljši mesec</b>: " + bestMonth.month + " (" + bestMonth.nights + " prenočitev)";
  }
    
  // Read data from .csv file
  const url = "https://raw.githubusercontent.com/Lazzo23/Tourist-Visualization/main/data.csv";
  d3.csv(url, function(data) {

    let Data = prepareData(data);
    var allGroups = d3.map(Data, function(d){return(d.country)}).keys();

    // Add countries to the button
    d3.select("#selectCountry")
      .selectAll('myOptions')
      .data(allGroups)
      .enter()
      .append('option')
      .text(function (d) { return d; })           // text showed in the menu
      .attr("value", function (d) { return d; })  // corresponding value returned by the button

    // Add X axis
    var x = d3.scaleBand()
      .domain(d3.map(Data, function(d){return(d.month)}).keys())
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).tickValues(x.domain().filter(function(d, i) { return i % Math.ceil(x.domain().length / 8) === 0; })));
    svg.append("text")             
      .attr("transform", "translate(" + (width/2 - 20) + " ," + (height + margin.top ) + ")")
      .style("text-anchor", "middle")
      .text("Čas");

    // Add Y axis
    var y = d3.scaleLinear()
      .domain([0, d3.max(Data, function(d) { return +d.nights; })])
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 50)
      .attr("x",0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Število turistov");    

    // Legend
    var legend_keys = ["Prenočitve", "Prihodi"]
    const colDict = {Prenočitve: 'rgb(77, 255, 136)', Prihodi: 'rgb(0, 153, 51)'}

    var lineLegend = svg.selectAll(".lineLegend").data(legend_keys)
      .enter().append("g")
      .attr("class","lineLegend")
      .attr("transform", function (d,i) {return "translate(" + (margin.left) + "," + (i*20)+")";});
    lineLegend.append("text").text(function (d) {return d;})
      .attr("transform", "translate(15, 6)");
    lineLegend.append("rect")
      .attr("fill", d => colDict[d])
      .attr("width", 12).attr('height', 5);

    // Initialize line with first country of the list
    var lineNights = svg
      .append('g')
      .append("path")
      .datum(Data.filter(function(d){return d.country==allGroups[0]}))
      .attr("d", d3.line()
        .x(function(d) { return x(d.month) })
        .y(function(d) { return y(+d.nights) })
      )
      .attr("stroke", "rgb(77, 255, 136)")
      .style("stroke-width", 3)
      .style("fill", "none");

    // Adding circles
    var circlesNights = svg.selectAll(".dot")
      .data(Data.filter(function(d) { return d.country == allGroups[0]; }))
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", function(d) { return x(d.month); })
      .attr("cy", function(d) { return y(+d.nights); })
      .attr("r", 5)
      .attr("fill", "rgb(77, 255, 136)")
      .attr("stroke", "white")
      .attr("stroke-width", 0)
      .on("mouseover", function(d) {
        tooltip.text(d.month + ": " + d.nights + " prenočitev, " + d.arrivals + " turistov")
              .style("visibility", "visible");
        d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 10);
          d3.select(this).style("cursor", "pointer");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
        d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 5);
      });

    // Text adding
    var tooltip = svg.append("text")
      .style("visibility", "hidden")
      .style("font-size", "12px")
      .style("fill", "black")
      .style("pointer-events", "none")
      .style("background-color", "black")
      .attr("text-anchor", "middle");

    // Update text based on mouse movement
    svg.on("mousemove", function() {
      var coordinates = d3.mouse(this);
      tooltip.attr("x", coordinates[0])
          .attr("y", coordinates[1] - 15);
    });

    var lineArrivals = svg
      .append('g')
      .append("path")
      .datum(Data.filter(function(d){return d.country==allGroups[0]}))
      .attr("d", d3.line()
        .x(function(d) { return x(d.month) })
        .y(function(d) { return y(+d.arrivals) })
      )
      .attr("stroke", "rgb(0, 153, 51)")
      .style("stroke-width", 3)
      .style("fill", "none");
      
    // Calculate basic statistics
    calculateStatistics(Data, allGroups[0]);

    // A function that updates the chart
    function update(selectedCountry) {

      // Create new data with the selection
      var dataFilter = Data.filter(function(d){return d.country==selectedCountry})

      // Give these new data to update line
      lineNights
        .datum(dataFilter)
        .transition()
        .duration(500)
        .attr("d", d3.line()
          .x(function(d) { return x(d.month) })
          .y(function(d) { return y(+d.nights) })
        )
        .attr("stroke", "rgb(77, 255, 136)");

      // Posodobi položaj krogcev
      circlesNights.data(dataFilter)
        .transition()
        .duration(500)
        .attr("cx", function(d) { return x(d.month); })
        .attr("cy", function(d) { return y(+d.nights); });

        
      lineArrivals
        .datum(dataFilter)
        .transition()
        .duration(500)
        .attr("d", d3.line()
          .x(function(d) { return x(d.month) })
          .y(function(d) { return y(+d.arrivals) })
        )
        .attr("stroke", "rgb(0, 153, 51)");

      calculateStatistics(Data, selectedCountry);
    }

    // Run the updateChart function with this selected option
    d3.select("#selectCountry").on("change", function(d) {
        var selectedCountry = d3.select(this).property("value")
        update(selectedCountry)
    })
  });
});
  