import * as d3 from "d3";

const loadShotChart = (shotsData) => {
    // Select the parent div for the chart
    const chartDiv = d3.select("#shot-chart").html("");

    // Create the SVG element
    const svg = chartDiv.append("svg")
      .attr("viewBox", "0,0,540,570")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "65%")
      .attr("height", "65%")
      .style("background", "#ffffff");

    // Add footer group
    const footer = svg.append("g")
      .attr("class", "footer")
      .attr("transform", "translate(10, 560)");

    const missedCount = shotsData.filter(obj => obj.shot_result === "Missed").length;
    const madeCount = shotsData.filter(obj => obj.shot_result === "Made").length;
    footer.append("text")
      .attr("fontFamily", "Roboto")
      .html(`<tspan>FG%: </tspan><tspan fontWeight="800">${(madeCount/(madeCount+missedCount))*100}%</tspan><tspan> (${madeCount}/${madeCount+missedCount})</tspan>`);

    // Add legend group
    const legend = svg.append("g")
      .append("g")
      .attr("class", "legend")
      .attr("transform", "translate(520, 560)")
      .html('<text text-anchor="end" fontFamily="Roboto">Miss</text> <path transform="translate(-44, -6)" d="M -5,-5 L 5,5 M 5,-5 L -5,5" fill="rgba(255,255,255, 0.1" stroke="rgba(187, 0, 0, 0.8)" stroke-width="3"></path> <text transform="translate(-80, 0)" text-anchor="end" fontFamily="Roboto">Made</text> <path transform="translate(-130, -6)" d="M -5, 0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0" fill="rgba(255,255,255, 0.1" stroke="rgba(10, 158, 117, 0.8)" stroke-width="3"></path>')

    const court = svg.append("g")
        .attr("class", "court")
        .attr("transform", "translate(20, 50)");

    court.append("rect")
        .attr("fill", "#f3f7fd")
        .attr("x", -20)
        .attr("y", -20)
        .attr("width", 540)
        .attr("height", 510)

    const markings = court.append("g")
        .attr("class", "markings")
        .html('<path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M470,0v140"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M30,0v140"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M330,0v190"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M170,0v190"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M310,0v190"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M190,0v190"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M330,190H170"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M280,40h-60"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M250,40v2.5"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M290,40v10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M210,40v10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M250,42.5c4.1,0,7.5,3.4,7.5,7.5s-3.4,7.5-7.5,7.5s-7.5-3.4-7.5-7.5S245.9,42.5,250,42.5z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M0,0v470h190c0-33.1,26.9-60,60-60s60,26.9,60,60h190V0H0z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M250,410c-33.1,0-60,26.9-60,60h40c0-11,9-20,20-20s20,9,20,20h40C310,436.9,283.1,410,250,410z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M250,450c-11,0-20,9-20,20h40C270,459,261,450,250,450z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M310,190c0,33.1-26.9,60-60,60s-60-26.9-60-60c0,33.1,26.9,60,60,60S310,223.1,310,190z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-dasharray:5,10" d="M310,190c0-33.1-26.9-60-60-60s-60,26.9-60,60c0-33.1,26.9-60,60-60S310,156.9,310,190z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M290,50c0,22.1-17.9,40-40,40s-40-17.9-40-40c0,22.1,17.9,40,40,40S290,72.1,290,50z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M469.8,139.9c-49.7,121.4-188.3,179.6-309.7,129.9c-59-24.1-105.8-70.9-129.9-129.9 c49.7,121.4,188.3,179.6,309.7,129.9C398.9,245.7,445.7,198.9,469.8,139.9z"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M140,0v5"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M359.9,0v5"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M470,281.6h30"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="stroke-linecap:round" d="M0,286.7h30"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="" d="M170,69.8h-10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="" d="M170,79.9h-10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="" d="M170,109.9h-10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="" d="M170,140h-10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="" d="M340,69.8h-10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="" d="M340,79.9h-10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" style="" d="M340,109.9h-10"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" d="M0,140h30"></path> <path class="mark" fill="none" stroke="#1d428a" stroke-width="2.6" d="M470,139.9h30"></path>')
    // ... More code for appending the rest of the elements to the SVG

    const made_d = "M -5, 0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0";
    const missed_d = "M -5,-5 L 5,5 M 5,-5 L -5,5"
    const made_stroke = "rgba(10, 158, 117, 0.8)"
    const missed_stroke = "rgba(187, 0, 0, 0.8)"

    for (const shotData of shotsData) {
        if (shotData.shot_result != 'Missed' && shotData.shot_result != 'Made') continue;
        const shot = court.append('g')
            .attr('class', 'shot');
        shot.append('title')
            .text(shotData.description);
        shot.append('path')
            .attr('transform', `translate(${shotData.x_legacy + 250}, ${shotData.y_legacy + 50})`)
            .attr('d', `${shotData.shot_result == 'Made' ? made_d : missed_d}`)
            .attr('fill', 'rgba(255, 255, 255, 0.1)')
            .attr('stroke', `${shotData.shot_result == 'Made' ? made_stroke : missed_stroke}`)
            .attr('stroke-width', '3');
    }

}

export default loadShotChart