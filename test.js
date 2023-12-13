document.addEventListener('DOMContentLoaded', function () {
    var colorNights = "rgb(90, 170, 78)";
    var colorArrivals = "rgb(6, 102, 89)";
    var colorBars = "rgb(102, 179, 204, 0.5)";

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

    function prepareWeatherData(data) {
        data.forEach(function(entry) {
            Object.keys(entry).forEach(function(key, index) {
                if (index >= 3) entry[key] = Number(entry[key]);
            });
        });
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
    const urlTouristData = "https://raw.githubusercontent.com/Lazzo23/Tourism-Data-Visualization-Trzic/main/data/touristData.csv";
    const urlWeatherData = "https://raw.githubusercontent.com/Lazzo23/Tourism-Data-Visualization-Trzic/main/data/weatherData.csv";


    d3.csv(urlTouristData, function(touristData) {
        d3.csv(urlWeatherData, function(weatherData) {
            
            let Data = prepareData(touristData);
            var listOfCountries = d3.map(Data, function(d){return(d.country)}).keys();

            prepareWeatherData(weatherData);
            var listOfWeatherData = Object.keys(weatherData[0]).slice(3);
            
            


            console.log(listOfWeatherData);
            
        
            // Add countries to the button
            d3.select("#selectCountry")
                .selectAll('myOptions')
                .data(listOfCountries)
                .enter()
                .append('option')
                .text(function (d) { return d; })           // text showed in the menu
                .attr("value", function (d) { return d; })  // corresponding value returned by the button

            // Add weather data to the button
            d3.select("#selectWeatherData")
                .selectAll('myOptions')
                .data(listOfWeatherData)
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
                .domain([0, d3.max(Data.filter(function(d){return d.country==listOfCountries[0]}), function(d) { return +d.nights; })])
                .range([ height, 0 ])

            svg.append("g")
                .call(d3.axisLeft(y))
                .attr("class", "yTouristAxis");

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left + 40)
                .attr("x",0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Število prenočitev in turistov");    
        
            
        
                var yWeather = d3.scaleLinear()
                .domain([0, d3.max(weatherData, function(d) { return +d[listOfWeatherData[0]]; })])
                .range([height, 0]);
            
            
            // Dodajte drugo Y os
            svg.append("g")
                .attr("class", "yWeatherAxis")
                .attr("transform", "translate(" + width + ", 0)")
                .call(d3.axisRight(yWeather));

                svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", width - margin.right + 130)
                .attr("x",0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Vremenski podatki");
            
                var barsWeather = svg.selectAll(".barWeather")
            .data(weatherData)
            .enter()
            .append("rect")
            .attr("class", "barWeather")
            .attr("x", function(d) { return x(d["valid"]) + x.bandwidth() / 2; })
            .attr("y", function(d) { return yWeather(d[listOfWeatherData[0]]); })
            .attr("width", x.bandwidth() * 0.6)  // Prilagodite glede na želeno širino stolpcev
            .attr("height", function(d) { return height - yWeather(d[listOfWeatherData[0]]); })
            .attr("fill", colorBars);

            
            // Initialize line with first country of the list
            var lineNights = svg
                .append('g')
                .append("path")
                .datum(Data.filter(function(d){return d.country==listOfCountries[0]}))
                .attr("d", d3.line()
                .x(function(d) { return x(d.month) })
                .y(function(d) { return y(+d.nights) })
                )
                .attr("stroke", colorNights)
                .style("stroke-width", 3)
                .style("fill", "none");
        
            // Adding circles
            var circlesNights = svg.selectAll(".dot")
                .data(Data.filter(function(d) { return d.country == listOfCountries[0]; }))
                .enter().append("circle")
                .attr("class", "dot")
                .attr("cx", function(d) { return x(d.month); })
                .attr("cy", function(d) { return y(+d.nights); })
                .attr("r", 7)
                .attr("fill", colorNights)
                .attr("stroke", "white")
                .attr("stroke-width", 0)
                .on("mouseover", function(d) {
                tooltip.text(d.month + ": " + d.nights + " prenočitev, " + d.arrivals + " turistov")
                        .style("visibility", "visible");
                d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 10);
                })
                .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
                d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", 7);
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
                .datum(Data.filter(function(d){return d.country==listOfCountries[0]}))
                .attr("d", d3.line()
                .x(function(d) { return x(d.month) })
                .y(function(d) { return y(+d.arrivals) })
                )
                .attr("stroke", colorArrivals)
                .style("stroke-width", 3)
                .style("fill", "none");
                
            // Calculate basic statistics
            calculateStatistics(Data, listOfCountries[0]);

            // Legend
            var legend_keys = ["Prenočitve", "Prihodi", "Vremenski podatki"]
            const colDict = {Prenočitve: colorNights, Prihodi: colorArrivals, "Vremenski podatki":colorBars}
        
            var lineLegend = svg.selectAll(".lineLegend").data(legend_keys)
                .enter().append("g")
                .attr("class","lineLegend")
                .attr("transform", function (d,i) {return "translate(" + (margin.left - 60) + "," + (i*20)+")";});
            lineLegend.append("text").text(function (d) {return d;})
                .attr("transform", "translate(20, 11)");
            lineLegend.append("rect")
                .attr("fill", d => colDict[d])
                .attr("width", 12).attr('height', 12);
        
            // A function that updates the chart
            function update(selectedCountry) {
        
                // Create new data with the selection
                var dataFilter = Data.filter(function(d){return d.country==selectedCountry})

                y.domain([0, d3.max(dataFilter, function(d) { return +d.nights; })]);
        
                // Give these new data to update line
                lineNights
                .datum(dataFilter)
                .transition()
                .duration(500)
                .attr("d", d3.line()
                    .x(function(d) { return x(d.month) })
                    .y(function(d) { return y(+d.nights) })
                )
                .attr("stroke", colorNights);
        
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
                .attr("stroke", colorArrivals);

                
                

                svg.select(".yTouristAxis")
                .transition()
                .duration(500)
                .call(d3.axisLeft(y));
        
                calculateStatistics(Data, selectedCountry);
            }
        
            // Run the updateChart function with this selected option
            d3.select("#selectCountry").on("change", function(d) {
                update(d3.select(this).property("value"))
            })


            function updateWeather(selectedKey) {
                // Posodobite izbrani ključ
                selectedKey = selectedKey;
            
                // Ponovno pripravite podatke za stolpčni diagram
                var barsData = weatherData.map(function(d) {
                    return {
                        valid: d.valid,
                        value: d[selectedKey]
                    };
                });
            
                // Posodobite os Y glede na nove podatke
                yWeather.domain([0, d3.max(barsData, function(d) { return +d.value; })]);

                
            
                // Posodobite stolpce na grafu
                var bars = svg.selectAll(".barWeather")
                    .data(barsData);
            
                bars.exit().remove(); // Odstranite odvečne stolpce
                bars.enter()
                    .append("rect")
                    .attr("class", "barWeather")
                    .merge(bars) // Posodobite obstoječe in nove stolpce
                    .transition()
                    .duration(500)
                    .attr("x", function(d) { return x(d.valid) + x.bandwidth() / 2; })
                    .attr("y", function(d) { return yWeather(+d.value); })
                    .attr("width", x.bandwidth() * 0.6)
                    .attr("height", function(d) { return height - yWeather(+d.value); })
                    .attr("fill", colorBars);
            
                // ... ostali deli kode ...

                svg.select(".yWeatherAxis")
                .transition()
                .duration(500)
                .call(d3.axisRight(yWeather));
            
            }

            // Run the updateChart function with this selected option
            d3.select("#selectWeatherData").on("change", function(d) {
                updateWeather(d3.select(this).property("value"))
            })
        });
    });

    
  });


