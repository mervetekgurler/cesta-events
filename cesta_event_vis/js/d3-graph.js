// if both d3v3 and d3v4 are loaded, we'll assume
// that d3v4 is called d3v4, otherwise we'll assume
// that d3v4 is the default (d3)
if (typeof d3v4 == 'undefined')
    d3v4 = d3;

var links = null;
var nodes = null;
var yAxisG = null;
var simulation = null;
var selectedNode = null;
var clippingToTimeline = false; // it is the status of checkbox
var showingHighlight = true;
// var shiftView = false;


// Shift Views 

function createD3Graph(graph, parentWidth, parentHeight, pageType) {
    var x = document.getElementById("detail-area-container");
    var y = document.getElementById("d3_svg");
    var z = document.getElementById("d3_selectable_force_directed_graph");
    x.style.display = "none";
    x.style.zIndex = 1;
    
    y.style.display = "block";
    z.style.zIndex = 10;
    var svg = d3v4.select('svg')
    .attr('width', '100%')
    .attr('height', '100%')

    // remove any previous graphs
    svg.selectAll('.g-main').remove();

    var gMain = svg.append('g')
    .classed('g-main', true)

    // add background
    var rect = gMain.append('rect')
    .classed('graph-background', true)
    .attr('width', '100%')
    .attr('height', '100%')

    // add graph
    // give graph a reasonable size and position for different screen sizes / aspect ratios using shallow trickery
    var reasonableScreenSizeScaleMultiple = 1;
    var initXTransform = 1;
    var initYTransform = 1;
    
    // layout
    reasonableScreenSizeScaleMultiple = 30000;
        initXTransform = parentWidth / 2;
        initYTransform = parentHeight / 2;

    var initScale = Math.max(parentWidth, parentHeight) / (reasonableScreenSizeScaleMultiple);

    var gDraw = gMain.append('g')
    .attr("transform","translate("+ initXTransform + ", " + initYTransform + ") scale(" + initScale + ")");

    // add Y axis
    // map domain to range
    var yScale = d3v4.scaleLinear()
    .domain([parentHeight - 96, 96]) // unit:
    .range([parentHeight - 96, 96]); // unit:

    var yAxis = createYAxis(yScale)
    
    yAxisG = gMain.append("g")
    .classed('y-axis', true)
    .call(yAxis)
    .attr("opacity", 0)
    .attr("transform", "translate(" + (parentWidth * 0.08 + 38) + "," + 0 + ")");

    // Add zoom callback
    var zoom = d3v4.zoom()
    .on('zoom', zoomed);
    gMain.call(zoom).call(zoom.transform, d3v4.zoomIdentity.translate(initXTransform, initYTransform).scale(initScale));

    function zoomed() {
        gDraw.attr('transform', d3v4.event.transform);
        var newYScale = d3v4.event.transform.rescaleY(yScale);
        yAxisG.call(createYAxis(newYScale))
    }

    // Add resize callback
    window.addEventListener('resize', function() {
        var graphContainer = document.getElementById("d3_selectable_force_directed_graph")
        yAxisG.attr("transform", "translate(" + (graphContainer.clientWidth * 0.08 + 38) + "," + 0 + ")");
    });

    //------------------------------------------
    // Link and linkLabel
    //------------------------------------------

    // Add links to the graph
    links = gDraw.append("g")
    .attr("class", "link")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("stroke-width", function(d) {
        // Define stroke width based on the type of connection
        switch (d.type) {
            case "people_attended_event":
                    return 3;
            default:
                return Math.sqrt(d.value);
        }
    })
    .attr("stroke", function(d) {
        // Define stroke color based on the type of connection
        switch (d.type) {
            case "people_attended_event":
                return "rgba(155, 175, 195, 0.5)";
            default:
                return "none"; // Default case to handle unexpected types
        }
    });



    //------------------------------------------
    // nodes and nodeLabels
    //------------------------------------------

    //------------------------------------------
    // Configuration Maps
    //------------------------------------------
    const nodeSizeConfig = {
        person: (n) => 40 + 10*n.value,
        event: 30

    };

    const nodeColorConfig = {
        connection: (n) => {
            const typeColors = {
                correspondence: "rgba(155, 175, 195, 0.4)",
                linked: "rgba(133, 64, 222, 0.96)",
                unsure: "rgba(0, 51, 204, 0.96)",
                friend: "rgba(0, 153, 255, 0.96)",
                marriage: "rgba(41, 202, 127, 0.99)",
                family: "rgba(14, 169, 3, 0.96)",
                influence: "rgba(0, 51, 204, 0.96)"
            };
            return typeColors[n.type] || "rgba(0, 153, 255, 0.96)";
        },
        person: "rgba(0, 153, 255, 0.96)",
        event: (n) => {
            const typeColors = { 
                2024: "rgba(23, 94, 84, 0.96)",
                2023: "rgba(39, 153, 137, 0.96)",
                2022: "rgba(143, 153, 62, 0.96)",
                2021: "rgba(111, 162, 135, 0.96)",
                2020: "rgba(66, 152, 181, 0.96)",
                2019: "rgba(0, 124, 146, 0.96)",
                2018: "rgba(98, 0, 89, 0.96)",
                2017: "rgba(101, 28, 50, 0.96)",
                2016: "rgba(93, 75, 60, 0.96)",
            };
            return typeColors[n.properties.year] || "rgba( 233, 131, 0, 0.8)";
        }
    };

    //------------------------------------------
    // Nodes
    //------------------------------------------
    const nodes = gDraw.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", n => typeof nodeSizeConfig[n.labels[0]] === 'function' ? nodeSizeConfig[n.labels[0]](n) : nodeSizeConfig[n.labels[0]])
        .attr("fill", n => typeof nodeColorConfig[n.labels[0]] === 'function' ? nodeColorConfig[n.labels[0]](n) : nodeColorConfig[n.labels[0]])
        .call(d3v4.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    nodes.append("title").text(n => n.properties.name);

    //------------------------------------------
    // Configuration for Node Labels
    //------------------------------------------
    const labelTextConfig = {
        person: (n) => n.properties.name,
        // event: (n) => n.properties.name
    };

    const labelOpacityConfig = {
        person: (n) => 0.7 + 0.05 * n.value,
        event: 0.8
    };

    const labelFontSizeConfig = {
        person: (n) => 50 + 10 * n.value,
        event: 50
    };

    //------------------------------------------
    // Create Node Labels
    //------------------------------------------
    nodeLabels = gDraw.append("g")
        .attr("class", "node-labels")
        .selectAll("text")
        .data(graph.nodes)
        .enter().append("text")
        .text(n => labelTextConfig[n.labels[0]] ? labelTextConfig[n.labels[0]](n) : "")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("opacity", n => typeof labelOpacityConfig[n.labels[0]] === 'function' ? labelOpacityConfig[n.labels[0]](n) : labelOpacityConfig[n.labels[0]])
        .attr("font-family", "sans-serif")
        .attr("font-size", n => typeof labelFontSizeConfig[n.labels[0]] === 'function' ? labelFontSizeConfig[n.labels[0]](n) : labelFontSizeConfig[n.labels[0]])
        .attr("fill", "rgba(255, 255, 255, 0.96)")
        .attr("style", n => n.labels[0] === "connection" && n.type === "correspondence" ? "font-style: italic;" : "")
        .call(d3v4.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

//------------------------------------------
// simulation
//------------------------------------------

    // https://stackoverflow.com/questions/47510853/how-to-disable-animation-in-a-force-directed-graph
    simulation = d3v4.forceSimulation()
        .force("link", d3v4.forceLink()
                .id(function(d) { return d.id; })
                .distance(function(d) { return 400;}))
        .force("charge", d3v4.forceManyBody().distanceMin(15).strength(-6500).theta(0.8))
        // .force("charge", d3v4.forceManyBody().distanceMin(10).strength(-6500))
        // .force('charge', d3.forceManyBody().strength(-1900).theta(0.5).distanceMax(1500))
        .force("center", d3v4.forceCenter(parentWidth / 2, parentHeight / 2))
        .force("x", d3v4.forceX(parentWidth/2))
        .force("y", d3v4.forceY(parentHeight/2))
        .force("collide", d3.forceCollide().strength([0.3]));

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);
    
    simulation.force("node")
        .texts(graph.links);

    function ticked() {
        // https://observablehq.com/@d3/simulation-tick
        // simulation.tick(n) runs n iterations of a force simulation layout.
        // update node and line positions at every step of the force simulation
        links.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        nodes.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        nodeLabels.attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y-10; });

        linkLabels.attr("x", function(d) { return (d.source.x+d.target.x)/2; })
            .attr("y", function(d) { return (d.source.y+d.target.y)/2; });
    }

//------------------------------------------
// interactions
//------------------------------------------

    // click
    rect.on('click', () => {
        resetSelectedNode(nodes, links);
    });

    // drag
    function dragstarted(d) {
        if (!d3v4.event.active) simulation.alphaTarget(0.9).restart();
        setSelectedNode(d, nodes, links);
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx += d3v4.event.dx;
        d.fy += d3v4.event.dy;
    }

    function dragended(d) {
        if (!d3v4.event.active) simulation.alphaTarget(0);
        d.fx = null;
        if(clippingToTimeline) {
            d.fy = d.savedFy;
        } else {
            d.fy = null;
        }
    }
};

// y axis
function createYAxis(scale) {
    return d3v4.axisLeft(scale)
    .ticks(10)
    .tickFormat(function(d) {
        var yearsAd = Math.floor(2000 - d);
        if(yearsAd >= 0) {
            return yearsAd + "";
        } else {
            return Math.abs(yearsAd) + " BC"
        }
    })
}

// Selects a node when clicked in the graph
function setSelectedNode(node, allNodes, allLinks) {
    // Return if the same node is clicked again (no change)
    if (selectedNode === node) return;

    // Deselect the previous selected node if any
    if (selectedNode !== null) {
        allLinks.classed("influences", false);
        allLinks.classed("influenced-by", false);
    }

    // Highlight the selected node and dim others
    allNodes.classed("selected", n => n.id === node.id);
    allNodes.classed("not-selected", n => n.id !== node.id);

    // Highlight links where the selected node is the source or target
    allLinks.classed("influenced-by", l => l.source.id === node.id);
    allLinks.classed("influences", l => l.target.id === node.id);

    // Display information based on the node's label
    switch (node.labels[0]) {

        case "person":
            showPersonInfo(node);
            break;
        case "event":
            showEventInfo(node);
            break;
    }

    // Update the global selected node
    selectedNode = node;
}


function resetSelectedNode(allNodes, allLinks) {
    selectedNode = null;
    allNodes.classed("selected", false);
    allLinks.classed("influences", false);
    allLinks.classed("influenced-by", false);
}
// Utility to open modal and set common attributes
function openModalWithInfo(node, titlePrefix = "") {
    $('.modal').modal('open');
    // $('#PeopleName').text(titlePrefix + node.properties.name);
    // name or title
    $('#PeopleName').text(titlePrefix + (node.properties.name || node.properties.title));
}

// Utility to format HTML content
function formatHtml(content) {
    return content.map(line => `<br/>${line}`).join('');
}

// Displays information for people

function showPersonInfo(node) {
    openModalWithInfo(node);
    const eventNameHtml = node.properties.events.map(event => {
        return `<li><a href="${event.link}" target="_blank">${event.title}</a></li>`;
    }).join('');

    const content = [
        // `<i><strong>${node.properties.name}</strong></i>`, // Uncomment and corrected closing tags
        `<strong>CESTA Events Attended:</strong><ul>${eventNameHtml}</ul>` // Properly format the list of events
    ];

    $('#PeopleDescription').html(content.join('')); // Join the content array to a single string
}


function showEventInfo(node) {
    openModalWithInfo(node, "Event");
    const content = [
        // `<strong><i>${node.properties.name}</i></strong>`,  // Uncommented and made sure to properly close tags
        `<strong>Click here:</strong> <a href="${node.properties.url}" target="_blank">${node.properties.name}</a>`,  // Create a clickable link
        `<strong>Date:</strong> ${node.properties.date}`,  // Display the date of the event
        `<strong>Location:</strong> ${node.properties.location}`,  // Display the location of the event
        `<strong>Description:</strong> <p>${node.properties.description}</p>`,  // Display the description in a paragraph for better formatting
        
    ];
    $('#PeopleDescription').html(formatHtml(content));
}


// =================================================================
// highlightt


function highlightNode(checkboxStatus) {

    var color = ["rgb(255, 188, 43)", "rgba(48, 87, 186, 0.959)"];

    // is just a bool
    if(checkboxStatus ) {
        
        nodes.attr("fill", function(d) { return color[d.gender]; });
        showingHighlight = true;
    } else {
        
        nodes.attr("fill", function(d) { return color[1];});
        showingHighlight = false;
    }
}

function onClickHighlightNode() {
    var checkBox = document.getElementById("onClickHighlightNode");
    // checkBox.checked == true => checked
    // checkBox.checked == false => unchecked
    highlightNode(checkBox.checked);
}


// =================================================================
// search 

function searchByName() {
    // get strings in search bar
    var searchTerm = document.getElementById("search").value;
    // color 
    nodes.classed("search-match", function(n){
        if(searchTerm.length == 0) {
            return false;
        } else if (!(n.properties.name == null)) {
            return n.properties.name.toLowerCase().includes(searchTerm.toLowerCase());
        } else if (!(n.properties.title == null)) {
            return n.properties.title.toLowerCase().includes(searchTerm.toLowerCase());
        } 
        
    });
    // Not matched
    nodes.classed("not-search-match", function(n){
        if(searchTerm.length == 0 || n.properties.name == null && n.properties.title == null) {
            return false;
        } else {
            return !n.properties.title.toLowerCase().includes(searchTerm.toLowerCase());

        }
    });
}



