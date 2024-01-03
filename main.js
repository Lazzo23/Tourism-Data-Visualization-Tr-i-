document.addEventListener('DOMContentLoaded', function () {
    // Colours
    var colorNights = "rgb(90, 170, 78)";
    var colorArrivals = "rgb(6, 102, 89)";
    var colorBars = "rgb(102, 179, 204, 0.3)";
    var colorSelectedBar = "rgb(102, 179, 204, 0.5)";

    // Line chart dimensions and margins
    var margin = {top: 50, right: 100, bottom: 30, left: 100};
    var width = 1150 - margin.left - margin.right;
    var height = 600 - margin.top - margin.bottom;
    
    // Append the svg object to the body of the page
    var svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("data-html", "true");

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
    function prepareDate(date) {
        const year = date.slice(0, 4);
        const month = date.slice(5);
    
        const monthNames = {
            "01": "Januar",
            "02": "Februar",
            "03": "Marec",
            "04": "April",
            "05": "Maj",
            "06": "Junij",
            "07": "Julij",
            "08": "Avgust",
            "09": "September",
            "10": "Oktober",
            "11": "November",
            "12": "December"
        };
    
        const monthName = monthNames[month];
    
        const result = `${monthName} ${year}`;
    
        return result;
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
        "<b>Skupno število turistov</b>: " + allArrivals + "<br>" +
        "<b>Povprečno število prenočitev na turista</b>: " + avgNights + "<br>" +
        "<b>Najboljši mesec</b>: " + prepareDate(bestMonth.month) + "<br>(" + bestMonth.nights + " prenočitev in " + bestMonth.arrivals + " turistov)";
    }

    // Calculate basic statistics
    function calculateWeatherStatistics(weatherData, type) {
        const typeWeather = weatherData.map(o => o[type]);
        var max = Math.max(...typeWeather);
        var min = Math.min(...typeWeather);
        var sum = typeWeather.reduce((a, b) => a + b, 0);
        sum = Math.round(sum)
        var avg = sum / typeWeather.length;
        avg = Math.round(avg * 100) / 100
        weatherStatistics.innerHTML = 
        "<b>Skupno število</b>: " + sum + "<br>" +
        "<b>Povprečje</b>: " + avg + "<br>" +
        "<b>Največja vrednost</b>: " + max + "<br>" +
        "<b>Najmanjša vrednost</b>: " + min + "<br>";
    }
    
    // Read data from .csv file
    const urlTouristData = "https://raw.githubusercontent.com/Lazzo23/Tourism-Data-Visualization-Trzic/main/data/touristData.csv";
    const urlWeatherData = "https://raw.githubusercontent.com/Lazzo23/Tourism-Data-Visualization-Trzic/main/data/weatherData.csv";

    d3.csv(urlTouristData, function(touristData) {
        d3.csv(urlWeatherData, function(weatherData) {
          
            let Data = prepareData(touristData);
            var listOfCountries = d3.map(Data, function(d){return(d.country)}).keys();
            console.log(Data);
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
            
            var weatherValueBackground = svg.append("rect")
                .attr("class", "weather-value-background")
                .attr("width", 40)
                .attr("height", 20)
                .attr("fill", "white")
                .attr("stroke", "rgb(102, 179, 204, 1)")
                .attr("stroke-width", 2)
                .style("opacity", 0);
            
            var weatherValueLabel = svg.append("text")
                .attr("class", "weather-value-label")
                .attr("text-anchor", "start")
                .attr("x", width + 10)
                .attr("y", 10)
                .style("opacity", 0)
                .style("font-size", "12px");
            
            var weatherGuideLine = svg.append("line")
                .attr("class", "weather-guide-line")
                .style("stroke-dasharray", "3,3")
                .style("stroke", "rgb(102, 179, 204, 1)")
                .attr("stroke-width", 2)
                .style("opacity", 0);
            
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
                        d3.select(this)
                                .attr("fill", colorSelectedBar);
                            weatherGuideLine
                                .attr("x1", x(d["valid"]))
                                .attr("y1", yWeather(d[listOfWeatherData[0]]))
                                .attr("x2", width)  // Končna točka na desni
                                .attr("y2", yWeather(d[listOfWeatherData[0]]))
                                .style("opacity", 1);
                            weatherValueBackground
                                .attr("x", width)
                                .attr("y", yWeather(d[listOfWeatherData[0]]) - 10)
                                .style("opacity", 1);
                            weatherValueLabel
                                .text(d[listOfWeatherData[0]])
                                .style("opacity", 1)
                                .attr("x", width + 5)
                                .attr("y", yWeather(d[listOfWeatherData[0]]) + 5);
                    })
                    .on("mouseout", function() {
                        weatherGuideLine.style("opacity", 0);
                        weatherValueBackground.style("opacity", 0);
                        weatherValueLabel.style("opacity", 0);
                        d3.select(this)
                                .attr("fill", colorBars);
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
            
            var valueBackground = svg.append("rect")
                .attr("class", "value-background")
                .attr("width", 40)
                .attr("height", 20)
                .attr("fill", "white")
                .attr("stroke", colorNights)
                .attr("stroke-width", 2)
                .style("opacity", 0);

            var valueLabel = svg.append("text")
                .attr("class", "value-label")
                .attr("text-anchor", "end")
                .attr("x", width +10)
                .attr("y", 10)
                .style("opacity", 0)
                .style("font-size", "12px");

            var guideLine = svg.append("line")
                .attr("class", "guide-line")
                .attr("stroke-width", 2)
                .style("stroke-dasharray", "3,3")
                .style("stroke", colorNights)
                .style("opacity", 0);
            
                
            
            

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
                    tooltipBackground
                        .style("opacity", 1);
                    tooltip
                        .text(d.arrivals + " turistov")
                        .style("visibility", "visible");
                    d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("r", 10);
                    guideLine
                        .attr("x1", x(d.month) + x.bandwidth() / 2)
                        .attr("y1", y(+d.nights))
                        .attr("x2", 0)
                        .attr("y2", y(+d.nights))
                        .style("opacity", 1);

                    valueBackground
                        .attr("x", -40)
                        .attr("y", y(+d.nights) - 10)
                        .style("opacity", 1);

                    valueLabel
                        .text(d.nights)
                        .style("opacity", 1)
                        .attr("x", -5)
                        .attr("y", y(+d.nights) + 5);
                })
                .on("mouseout", function() {
                    guideLine.style("opacity", 0);
                    valueBackground.style("opacity", 0);
                    valueLabel.style("opacity", 0);
                    tooltip.style("visibility", "hidden");
                    tooltipBackground
                        .style("opacity", 0);
                    d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("r", 7);
                });
        
            var tooltipBackground = svg.append("rect")
                .attr("class", "value-background")
                .attr("width", 100)
                .attr("height", 20)
                .attr("fill", "white")
                .attr("stroke", colorArrivals)
                .attr("stroke-width", 2)
                .style("opacity", 0);

            // Text adding
            var tooltip = svg.append("text")
                .style("visibility", "hidden")
                .style("font-size", "14px")
                .style("fill", "black")
                .style("pointer-events", "none")
                .attr("text-anchor", "middle");
        
            // Update text based on mouse movement
            svg.on("mousemove", function() {
                var coordinates = d3.mouse(this);
                tooltipBackground
                    .attr("x", coordinates[0] - 50)
                    .attr("y", coordinates[1] - 30);
                tooltip
                    .attr("x", coordinates[0])
                    .attr("y", coordinates[1] - 15);
            });
                
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
                        d3.select(this)
                            .attr("fill", colorSelectedBar);
                            weatherGuideLine
                                .attr("x1", x(d["valid"]))
                                .attr("y1", yWeather(d.value))
                                .attr("x2", width)  // Končna točka na desni
                                .attr("y2", yWeather(d.value))
                                .style("opacity", 1);
                            weatherValueBackground
                                .attr("x", width)
                                .attr("y", yWeather(d.value) - 10)
                                .style("opacity", 1);
                            weatherValueLabel
                                .text(d.value)
                                .style("opacity", 1)
                                .attr("x", width + 5)
                                .attr("y", yWeather(d.value) + 5);
                    })
                    .on("mouseout", function() {
                        weatherGuideLine.style("opacity", 0);
                        weatherValueBackground.style("opacity", 0);
                        weatherValueLabel.style("opacity", 0);
                        d3.select(this)
                            .attr("fill", colorBars);
                    })
                    .transition()
                    .duration(500)
                    .attr("x", function(d) { return x(d.valid)})
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
            /*

            // PORAZDELITEV
            var sumByCountry = {};
            
            // Seštevanje vrednosti za vsako državo
            Data.forEach(function(item) {
                var country = item.country;
                var nights = item.nights;

                var notCountry = new Set(["Država - SKUPAJ", "DOMAČI", "TUJI"]);
                
                // Ne štej držav v notCountry
                if (notCountry.has(country)) return;
            
                // Če države še ni v objektu, jo dodamo, sicer seštejemo vrednost
                sumByCountry[country] = (sumByCountry[country] || 0) + nights;
            });
             // Pretvorba slovarja v array objektov
            var dataArray = Object.keys(sumByCountry).map(function(country) {
                return { country: country, nights: sumByCountry[country] };
            });
            // Sortiranje arraya po vrednostih
            dataArray.sort(function(a, b) {
                return b.nights - a.nights; // padajoče sortiranje, za naraščajoče zamenjajte b in a
            });
            dataArray = dataArray.slice(0,5);
            console.log(dataArray);

            var width2 = 400;
            var height2 = 400;
        
            // Radij pita
            var radius = Math.min(width2, height2) / 2;
        
            // Barvna lestvica
            var color = d3.scaleOrdinal(d3.schemeCategory10);
        
            // Ustvarjanje SVG elementa
            var svg2 = d3.select("#pie-chart")
              .attr("width", width2)
              .attr("height", height2)
              .append("g")
              .attr("transform", "translate(" + width2 / 2 + "," + height2 / 2 + ")");
        
            // Podatki
            var x = Object.keys(sumByCountry).map(function(key){
                return sumByCountry[key];
            });; // Prilagodite glede na vaše potrebe
        
            // Ustvarjanje pita diagrama
            var pie = d3.pie();
            var arc = d3.arc().outerRadius(radius).innerRadius(0);
        
            // Dodajanje pita
            svg2.selectAll("path")
              .data(pie(x))
              .enter()
              .append("path")
              .attr("d", arc)
              .attr("fill", function(d, i) { return color(i); });
        
            // Dodajanje besedila
            svg2.selectAll("text")
              .data(pie(x))
              .enter()
              .append("text")
              .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
              .attr("text-anchor", "middle")
              .text(function(d) { return d.data; });
   
*/
        });
    });
});