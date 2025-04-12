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
        this.additionalData = {}; // Store different datasets
        this.activeDatasetType = 'tree'; // 'tree' or 'noise'
        this.onBoroughClickCallbacks = [];
        this.onBoroughHoverCallbacks = [];
        this.onTreeClickCallbacks = []; // Added for tree clicks
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

    setData(type, dataSet) {
        this.additionalData[type] = dataSet;
        if (type === this.activeDatasetType) {
            this.filteredData = dataSet; // Update filtered data if active
            this.updateVisualization();
        }
        return this;
    }

    setActiveDataset(type) {
        if (this.additionalData[type]) {
            this.activeDatasetType = type;
            this.filteredData = this.additionalData[type];
            this.updateVisualization();
        } else {
            console.warn(`Data for type '${type}' not loaded.`);
        }
        return this;
    }

    setFilteredData(dataSet) {
        this.filteredData = dataSet;
        this.updateVisualization(); // Use the unified update method
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
                
                // Update tooltip using helper
                this._updateTooltip(event, `<strong>${boroughName}</strong>`);

                // Only notify if data exists
                if (boroughData) {
                    // Notify listeners
                    this.onBoroughHoverCallbacks.forEach(callback =>
                        callback(boroughName, boroughData));
                } else {
                    console.warn(`No data found for borough: ${boroughName}`);
                }
            })
            .on("mouseout", () => {
                // Hide tooltip using helper
                this._hideTooltip();
            })
            .on("click", (event, d) => {
                const boroughName = d.properties.name;
                // Notify listeners about borough click
                this.onBoroughClickCallbacks.forEach(callback =>
                    callback(boroughName, this.boroughData[boroughName]));
            });

        this.updateVisualization(); // Call the unified update method
        return this;
    }

    updateVisualization() {
        if (!this.filteredData || !this.path) return;

        if (this.activeDatasetType === 'tree') {
            this.updateTreePoints();
        } else if (this.activeDatasetType === 'noise') {
            this.updateNoiseChoropleth();
        }
    }

    updateTreePoints() {
        // Define health color scale
        const healthColorScale = (health) => {
            switch (health?.toLowerCase()) {
                case 'good': return '#4CAF50'; // Green
                case 'fair': return '#FF9800'; // Orange
                case 'poor': return '#F44336'; // Red
                default: return '#9E9E9E'; // Grey for unknown/other
            }
        };

        // Explicitly reset borough fills before drawing tree points
        if (this.mapGroup && this.path && this.boroughData) {
            this.mapGroup.selectAll("path.borough")
                .interrupt() // Stop any ongoing fill transitions
                .attr("fill", d => { // Set fill directly (no transition needed here)
                    const boroughName = d.properties.name;
                    return this.boroughData[boroughName]?.color || "#ccc";
                })
                .style("display", null); // Ensure boroughs are visible
             console.log("[MapComponent - updateTreePoints] Reset borough fills.");
        } else {
             console.warn("[MapComponent - updateTreePoints] Could not reset borough fills.");
        }

        // Clear previous data points (circles)
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
            .on("mouseover", (event, d) => {
                const commonName = d.spc_common || 'Tree';
                const status = d.status || 'Unknown';
                const lat = d.latitude ? parseFloat(d.latitude).toFixed(4) : 'N/A';
                const lon = d.longitude ? parseFloat(d.longitude).toFixed(4) : 'N/A';
                this._updateTooltip(event, `<strong>${commonName}</strong><br/>Status: ${status}<br/>Coords: ${lat}, ${lon}`);
                d3.select(event.currentTarget).attr('r', 5).attr('opacity', 0.9);
            })
            .on("mouseout", (event, d) => {
                this._hideTooltip();
                d3.select(event.currentTarget).attr('r', 3).attr('opacity', 0.6);
            })
            .on("click", (event, d) => {
                console.log("[MapComponent] Tree clicked:", d);
                this.onTreeClickCallbacks.forEach(callback => callback(d));
            });

        // Ensure map paths are visible (redundant due to reset above, but safe)
        // this.mapGroup.selectAll("path").style("display", null);
    }

    updateNoiseChoropleth() {
        if (!this.filteredData || !this.path || !this.boroughData) return;

        // Aggregate noise complaints by borough
        const noiseCounts = {};
        this.filteredData.forEach(item => {
            const borough = item['Borough']; // Assuming 'Borough' field exists
            if (borough) {
                noiseCounts[borough] = (noiseCounts[borough] || 0) + 1;
            }
        });

        // Find min/max counts for color scale domain
        const counts = Object.values(noiseCounts);
        const minCount = d3.min(counts) || 0;
        const maxCount = d3.max(counts) || 1; // Avoid division by zero if max is 0

        // Define a color scale (e.g., yellow to red)
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([minCount, maxCount]);

        // Update borough fills based on noise counts
        this.mapGroup.selectAll("path")
            .transition()
            .duration(500)
            .attr("fill", d => {
                const boroughName = d.properties.name;
                const count = noiseCounts[boroughName] || 0;
                return colorScale(count);
            });

        // Clear tree points if they exist
        this.dataGroup.selectAll("circle").remove();

        // Update tooltip for choropleth
        this.mapGroup.selectAll("path")
            .on("mouseover.choropleth", (event, d) => {
                const boroughName = d.properties.name;
                const count = noiseCounts[boroughName] || 0;
                // Update tooltip using helper
                this._updateTooltip(event, `<strong>${boroughName}</strong><br/>Noise Complaints: ${count}`);
                // Trigger hover callback
                this.onBoroughHoverCallbacks.forEach(callback =>
                    callback(boroughName, { count: count }));
            })
            .on("mouseout.choropleth", () => {
                 // Hide tooltip using helper
                 this._hideTooltip();
            });
    }

    // New method to clear dynamic data layers
    clearAllLayers() {
        console.log("[MapComponent] Clearing dynamic layers...");
        // Remove data points (e.g., tree circles)
        if (this.dataGroup) {
             this.dataGroup.selectAll("circle").remove();
             console.log("[MapComponent] Removed circles from dataGroup.");
        }

        // Reset borough fills to their default colors and remove choropleth events
        if (this.mapGroup && this.path && this.boroughData) {
            this.mapGroup.selectAll("path.borough") // Target only borough paths
                 // Remove choropleth-specific event listeners first
                .on(".choropleth", null) // Remove listeners in .choropleth namespace
                .interrupt() // Stop existing transitions (like fill transition)
                .transition() // Use transition for smooth visual reset (optional)
                .duration(100) // Short duration for reset
                .attr("fill", d => { // Reset fill to default
                    const boroughName = d.properties.name;
                    // console.log(`[MapComponent] Resetting fill for ${boroughName}`); // Debug logging
                    return this.boroughData[boroughName]?.color || "#ccc"; // Use stored borough data color
                })
                .style("display", null); // Ensure paths are visible if hidden before
             console.log("[MapComponent] Reset borough path fills and removed .choropleth listeners.");
        } else {
            console.log("[MapComponent] Cannot reset borough fills - mapGroup, path, or boroughData missing?");
        }
        
        // // Original simpler reset (kept for reference)
        // if (this.mapGroup) {
        //      this.mapGroup.selectAll("path.borough")
        //         .on(".choropleth", null); 
        //      console.log("[MapComponent] Removed .choropleth event listeners.");
        // }
        

        return this; // Allow chaining
    }

    onBoroughClick(callback) {
        this.onBoroughClickCallbacks.push(callback);
        return this;
    }

    onTreeClick(callback) {
        this.onTreeClickCallbacks.push(callback);
        return this;
    }

    onBoroughHover(callback) {
        this.onBoroughHoverCallbacks.push(callback);
        return this;
    }

    _updateTooltip(event, content) {
        this.tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        this.tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    _hideTooltip() {
        this.tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }
}