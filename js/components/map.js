export class MapComponent {
    constructor(containerId, width, height) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.svg = null;
        this.tooltip = null;
        this.path = null;
        this.boroughData = {};
        this.filteredData = null;
        this.onBoroughClickCallbacks = [];
        this.onBoroughHoverCallbacks = [];
        this.hoveredBoroughs = new Set();
    }

    initialize() {
        // Create SVG and tooltip
        this.svg = d3.select("#" + this.containerId)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
            
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
            
        // Create a group for map elements
        this.mapGroup = this.svg.append("g");
        
        // Create a group for data points
        this.dataGroup = this.svg.append("g");
        
        return this;
    }
    
    setBoroughData(data) {
        this.boroughData = data;
        return this;
    }
    
    setAdditionalData(dataSet) {
        this.additionalData = dataSet;
        this.filteredData = dataSet;
        this.updateDataPoints();
        return this;
    }
    
    loadGeoJson(geoJson) {
        // Create projection and path generator for NYC
        const projection = d3.geoMercator()
            .fitSize([this.width, this.height], geoJson);
        this.path = d3.geoPath().projection(projection);
        
        // Create borough paths
        this.mapGroup.selectAll("path")
            .data(geoJson.features)
            .enter()
            .append("path")
            .attr("d", this.path)
            .attr("class", "borough")
            .attr("fill", d => {
                const boroughName = d.properties.name;
                return this.boroughData[boroughName]?.color || "#ccc";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => {
                const boroughName = d.properties.name;
                const boroughData = this.boroughData[boroughName];
                
                // Show tooltip
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                    
                this.tooltip.html(`
                    <strong>${boroughName}</strong>
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                
                // Only add to hovered boroughs and notify if data exists
                if (boroughData) {
                    // Add to hovered boroughs list
                    this.hoveredBoroughs.add(boroughName);
                    
                    // Notify listeners
                    this.onBoroughHoverCallbacks.forEach(callback => 
                        callback(boroughName, boroughData));
                } else {
                    console.warn(`No data found for borough: ${boroughName}`);
                }
            })
            .on("mouseout", () => {
                this.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", (event, d) => {
                const boroughName = d.properties.name;
                // Notify listeners about borough click
                this.onBoroughClickCallbacks.forEach(callback => 
                    callback(boroughName, this.boroughData[boroughName]));
            });
            
        this.updateDataPoints();
        return this;
    }
    
    updateDataPoints() {
        if (!this.filteredData || !this.path) return;
        
        // Define health color scale
        const healthColorScale = (health) => {
            switch (health?.toLowerCase()) {
                case 'good': return '#4CAF50'; // Green
                case 'fair': return '#FF9800'; // Orange
                case 'poor': return '#F44336'; // Red
                default: return '#9E9E9E'; // Grey for unknown/other
            }
        };
        
        // Clear previous data points
        this.dataGroup.selectAll("circle").remove();
        
        // Add data points if coordinates are available
        this.dataGroup.selectAll("circle")
            .data(this.filteredData)
            .enter()
            .append("circle")
            .attr("cx", d => {
                const coords = [+d.longitude, +d.latitude];
                const projectedCoords = this.path.projection()(coords);
                return projectedCoords ? projectedCoords[0] : null;
            })
            .attr("cy", d => {
                const coords = [+d.longitude, +d.latitude];
                const projectedCoords = this.path.projection()(coords);
                return projectedCoords ? projectedCoords[1] : null;
            })
            .attr("r", 3)
            .attr("fill", d => healthColorScale(d.status))
            .attr("opacity", 0.6)
            .attr("pointer-events", "none");
    }
    
    onBoroughClick(callback) {
        this.onBoroughClickCallbacks.push(callback);
        return this;
    }
    
    onBoroughHover(callback) {
        this.onBoroughHoverCallbacks.push(callback);
        return this;
    }
    
    getHoveredBoroughs() {
        return Array.from(this.hoveredBoroughs);
    }
}