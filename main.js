document.addEventListener('DOMContentLoaded', function () {
    // Colours
    var colorNights = "rgb(90, 170, 78)";
    var colorArrivals = "rgb(6, 102, 89)";
    var colorBars = "rgb(102, 179, 204, 0.3)";
    var colorSelectedBar = "rgb(102, 179, 204, 0.5)";

    // Line chart dimensions and margins
    var margin = {top: 30, right: 100, bottom: 30, left: 100};
    var width = 1150 - margin.left - margin.right;
    var height = 620 - margin.top - margin.bottom;
    
    // Append the svg object to the body of the page
    var svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Statistics
    const statistics = document.getElementById("statistics");
    const weatherStatistics = document.getElementById("weatherStatistics");

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

    // Calculate basic statistics
    function calculateWeatherStatistics(weatherData, type) {
        const typeWeather = weatherData.map(o => o[type]);
        var max = Math.max(...typeWeather);
        var min = Math.min(...typeWeather);
        var sum = typeWeather.reduce((a, b) => a + b, 0);
        sum = Math.round(sum * 100) / 100
        var avg = sum / typeWeather.length;
        avg = Math.round(avg * 100) / 100
        weatherStatistics.innerHTML = 
        "<b>Skupno število</b>: " + sum + "<br>" +
        "<b>Povprečje</b>: " + avg + "<br>" +
        "<b>Največjo vrednost</b>: " + max + "\<br>" +
        "<b>Najmanjša vrednost</b>: " + min + "<br>";
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
            listOfCountries.splice(3, listOfCountries.length - 3, ...listOfCountries.slice(3, listOfCountries.length).sort());
            
            // Add countries to the button
            d3.select("#selectCountryData")
                .selectAll('myOptions')
                .data(listOfCountries)
                .enter()
                .append('option')
                .text(function (d) { if(d == "Država - SKUPAJ") return "SKUPAJ"; else return d;})           // text showed in the menu
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
                .attr("x", function(d) { return x(d["valid"])})
                .attr("y", function(d) { return yWeather(d[listOfWeatherData[0]]); })
                .attr("width", x.bandwidth() * 0.9)  // Prilagodite glede na želeno širino stolpcev
                .attr("height", function(d) { return height - yWeather(d[listOfWeatherData[0]]); })
                .attr("fill", colorBars)
                .on("mouseover", function(d) {
                    tooltip.text(d[listOfWeatherData[0]])
                            .style("visibility", "visible");
                    d3.select(this)
                            .attr("fill", colorSelectedBar);
                    })
                    .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                    d3.select(this)
                            .attr("fill", colorBars);
                    });

            
            // Initialize line with first country of the list
            var lineNights = svg
                .append('g')
                .append("path")
                .datum(Data.filter(function(d){return d.country==listOfCountries[0]}))
                .attr("d", d3.line()
                .x(function(d) { return x(d.month) + x.bandwidth() / 2 })
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
                .attr("cx", function(d) { return x(d.month) + x.bandwidth() / 2  })
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
                .x(function(d) { return x(d.month) + x.bandwidth() / 2  })
                .y(function(d) { return y(+d.arrivals) })
                )
                .attr("stroke", colorArrivals)
                .style("stroke-width", 3)
                .style("fill", "none");
                
            // Calculate basic statistics
            calculateStatistics(Data, listOfCountries[0]);
            calculateWeatherStatistics(weatherData, listOfWeatherData[0]);

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
      
            // Update tourist graph
            function updateTouristData(selectedCountry) {
        
                // Create new data with the selection
                var dataFilter = Data.filter(function(d){return d.country == selectedCountry})
                
                // New Y domain based on new data
                y.domain([0, d3.max(dataFilter, function(d) { return +d.nights; })]);
        
                // Update nights
                lineNights.datum(dataFilter)
                    .transition()
                    .duration(500)
                    .attr("d", d3.line()
                    .x(function(d) { return x(d.month) + x.bandwidth() / 2  })
                    .y(function(d) { return y(+d.nights) }))
                    .attr("stroke", colorNights);
        
                // Update circles
                circlesNights.data(dataFilter)
                    .transition()
                    .duration(500)
                    .attr("cx", function(d) { return x(d.month) + x.bandwidth() / 2 })
                    .attr("cy", function(d) { return y(+d.nights) });
        
                // Update arrivals
                lineArrivals.datum(dataFilter)
                    .transition()
                    .duration(500)
                    .attr("d", d3.line()
                    .x(function(d) { return x(d.month) + x.bandwidth() / 2  })
                    .y(function(d) { return y(+d.arrivals) }))
                    .attr("stroke", colorArrivals);

                // Update Y axis
                svg.select(".yTouristAxis")
                    .transition()
                    .duration(500)
                    .call(d3.axisLeft(y));
                
                // Calculating new statistics based on new data
                calculateStatistics(Data, selectedCountry);
            }
      
            // Update weather graph
            function updateWeatherData(selectedWeather) {
                var barsData = weatherData.map(function(d) {return {valid: d.valid, value: d[selectedWeather]};});
                var bars = svg.selectAll(".barWeather").data(barsData);
            
                yWeather.domain([0, d3.max(barsData, function(d) { return +d.value; })]);
            
                // Posodobitev podatkov za stolpce
                bars.exit().remove(); // Odstrani odvečne stolpce
                bars = bars.enter()
                    .append("rect")
                    .attr("class", "barWeather")
                    .merge(bars)
                    .on("mouseover", function(d) {
                        tooltip.text(d.value)
                            .style("visibility", "visible");
                        d3.select(this)
                            .attr("fill", colorSelectedBar);
                    })
                    .on("mouseout", function() {
                        tooltip.style("visibility", "hidden");
                        d3.select(this)
                            .attr("fill", colorBars);
                    })
                    .transition()
                    .duration(500)
                    .attr("x", function(d) { return x(d.valid) + x.bandwidth() / 4; })
                    .attr("y", function(d) { return yWeather(+d.value); })
                    .attr("width", x.bandwidth() * 0.9)
                    .attr("height", function(d) { return height - yWeather(+d.value); })
                    .attr("fill", colorBars);
            
                // Posodobitev Y osi
                svg.select(".yWeatherAxis")
                    .transition()
                    .duration(500)
                    .call(d3.axisRight(yWeather));

                calculateWeatherStatistics(weatherData, selectedWeather);
            }
            

            // Call update functions
            d3.select("#selectCountryData").on("change", function(d) {
                updateTouristData(d3.select(this).property("value"))
            });

            d3.select("#selectWeatherData").on("change", function(d) {
                updateWeatherData(d3.select(this).property("value"))
            });
        });
    });
});