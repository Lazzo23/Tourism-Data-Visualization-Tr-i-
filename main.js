document.addEventListener('DOMContentLoaded', function () {

  // Line chart dimensions and margins
  var margin = {top: 10, right: 30, bottom: 30, left: 60},
  width = 1100 - margin.left - margin.right,
  height = 800 - margin.top - margin.bottom;
  
  // Append the svg object to the body of the page
  var svg = d3.select("#line-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
      .attr("transform", "translate(" + (width/2 - 20) + " ," + (height + margin.top + 20) + ")")
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
      .attr("y", 0 - margin.left)
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
      .attr("transform", "translate(15, 6)"); //align texts with boxes
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

    // A function that updates the chart
    function update(selectedGroup) {

      // Create new data with the selection
      var dataFilter = Data.filter(function(d){return d.country==selectedGroup})

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
        
      lineArrivals
        .datum(dataFilter)
        .transition()
        .duration(500)
        .attr("d", d3.line()
          .x(function(d) { return x(d.month) })
          .y(function(d) { return y(+d.arrivals) })
        )
        .attr("stroke", "rgb(0, 153, 51)");
    }

    // Run the updateChart function with this selected option
    d3.select("#selectCountry").on("change", function(d) {
        var selectedOption = d3.select(this).property("value")
        update(selectedOption)
    })
  });
});
  