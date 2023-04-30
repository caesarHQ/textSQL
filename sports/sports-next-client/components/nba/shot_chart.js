import * as d3 from "d3";

const loadShotChart = (playerData) => {
    var max = { 
        x: 780, 
        y: 650
    };
    var svg = d3.select("#shot-chart").html("");
    svg = d3.select("#shot-chart").append("svg:svg")
    .attr("width", max.x)
    .attr("height", max.y)
    .attr("background-color", "#122737")
    .append("g")
    .attr("id", "shotchart");

    var courtUrl = "https://miro.medium.com/v2/resize:fit:4800/1*2QjYg-iJ54sT1ywAoVxtaw.png"
    var courtBGUrl = "{% static 'images/court.jpg' %}";
    svg.append("svg:defs")
    .append("svg:pattern")
    .attr("id", "bg")
    .attr('patternUnits', 'userSpaceOnUse')
    .attr("width", max.x)
    .attr("height", max.y)
    .append("svg:image")
    .attr("id","image-url")
    .attr("xlink:href", courtUrl)
    .attr("width", max.x)
    .attr("height", max.y);

    svg.append("rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", max.x)
    .attr("height", max.y)
    .attr("fill", "url(#bg)");

    var xScale = d3.scaleLinear()
    .domain([-250, 250])
    .range([0, 780]);

    var yScale = d3.scaleLinear()
    .domain([-1,0, -150])
    .range([590,589, 371]);

    var colorValue = function(d) {
        if(d[3] === 0) {
            return "#8b0000";
        }
        if(d[3] === 1) {
            return "#013220";
        }
    }

    var xValue = function(d) {
        return xScale(-d[1]);
    }

    var yValue = function(d) {
        return (yScale(-d[2]));
    }

    var classByShot = function(d) {
        if(d[3] === "Missed Shot") {
            return "dot missed";
        }
        if(d[3] === "Made Shot") {
            return "dot made";
        }
    }

    d3.selectAll('dot').remove();
    var node = svg.selectAll("dot").data(playerData)
    node.enter()
    .append("svg:circle")
    .attr("r", 4)
    .attr("cx", function(d) { return  xValue(d);})
    .attr("cy", function(d) { return yValue(d);})
    .attr("class", function(d) { return classByShot(d);})
    .style("fill", function(d) { return colorValue(d);});
}

export default loadShotChart