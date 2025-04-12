export class MapComponent {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
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
        this.geoJsonLayer = null;
        this.dataGroup = null;
        this.projection = null;
        this.interactionLayer = null;
    }

    initialize() {
        this.map = L.map(this.containerId).setView([40.7128, -74.0060], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        L.svg({ clickable: true }).addTo(this.map);

        this.svg = d3.select("#" + this.containerId).select("svg");

        const g = this.svg.select("g").attr("class", "leaflet-zoom-hide");

        this.mapGroup = g.append("g").attr("class", "leaflet-map-pane");
        this.dataGroup = g.append("g").attr("class", "leaflet-marker-pane");

        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        this.projection = d3.geoMercator();
        this.path = d3.geoPath().projection(this.projection);

        this.map.on("viewreset moveend", this.updateD3LayerPositions.bind(this));

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
        this.geoJsonData = geoJson; // Store GeoJSON data

        // Clear existing paths if any
        this.mapGroup.selectAll("path.borough").remove();

        // Create borough paths within the mapGroup
        const feature = this.mapGroup.selectAll("path.borough")
            .data(geoJson.features)
            .enter()
            .append("path")
            .attr("class", "borough")
            .attr("stroke", "#fff") // Keep stroke
            .attr("stroke-width", 0.5) // Adjust stroke width if needed
            .attr("fill", d => {
                const boroughName = d.properties.name;
                return this.boroughData[boroughName]?.color || "#ccc";
            })
            .on("mouseover", (event, d) => {
                const boroughName = d.properties.name;
                const boroughData = this.boroughData[boroughName] || this.additionalData['noise']?.find(item => item.Borough === boroughName); // Find relevant data
                let content = `<strong>${boroughName}</strong>`;
                if (this.activeDatasetType === 'noise' && boroughData) {
                    const count = this.getNoiseCountForBorough(boroughName);
                    content += `<br/>Noise Complaints: ${count}`;
                }
                this._updateTooltip(event, content);
                d3.select(event.currentTarget).raise().style("stroke-width", 1.5).style("stroke", "black"); // Bring to front and highlight
                if (boroughData) {
                    this.onBoroughHoverCallbacks.forEach(callback =>
                        callback(boroughName, boroughData)); // Pass data if available
                }
            })
            .on("mouseout", (event, d) => {
                this._hideTooltip();
                 d3.select(event.currentTarget).style("stroke-width", 0.5).style("stroke", "#fff"); // Reset style
            });

        // Create an invisible Leaflet layer for interactions
        if (this.interactionLayer) {
            this.map.removeLayer(this.interactionLayer);
        }
        this.interactionLayer = L.geoJSON(geoJson, {
            style: { 
                opacity: 0, 
                fillOpacity: 0, 
                weight: 0, // No border either
                clickable: true // Explicitly allow clicks
            }
        })
        .on('mousedown', (e) => {
            // Stop mousedown propagation to prevent Leaflet drag
            L.DomEvent.stopPropagation(e.originalEvent); // Stop only propagation
            L.DomEvent.preventDefault(e.originalEvent); // Prevent default drag action
             console.log('[MapComponent] Interaction layer mousedown stopped.');
        })
        .on('click', (e) => {
            // Stop click propagation
            L.DomEvent.stopPropagation(e.originalEvent);
            L.DomEvent.preventDefault(e.originalEvent); // Prevent potential map click

            const layer = e.layer;
            const boroughName = layer.feature.properties.name;
            const boroughData = this.boroughData[boroughName];
            console.log(`[MapComponent] Interaction layer clicked: ${boroughName}`);
            // Trigger the callbacks defined in main.js
            this.onBoroughClickCallbacks.forEach(callback =>
                callback(boroughName, boroughData));
        });
        // Do NOT add to map here - add only when noise task is active
        // .addTo(this.map);
         console.log('[MapComponent] Created invisible interaction layer (not added yet).');

        // Fit map view to GeoJSON bounds initially
        const d3Bounds = d3.geoBounds(geoJson);
        const leafletBounds = L.latLngBounds([
            [d3Bounds[0][1], d3Bounds[0][0]], // Southwest corner (lat, lng)
            [d3Bounds[1][1], d3Bounds[1][0]]  // Northeast corner (lat, lng)
        ]);
        this.map.fitBounds(leafletBounds);

        // Call updateD3LayerPositions to draw paths correctly based on the fitted bounds
        this.updateD3LayerPositions();

        this.updateVisualization(); // Update based on active dataset
        return this;
    }

    updateD3LayerPositions() {
        if (!this.geoJsonData || !this.map) return; // Only run if GeoJSON data and map exist

        console.log("[MapComponent] Updating D3 layer positions (Leaflet aware)...");

        // Update D3 projection based on Leaflet's current view
        const map = this.map;
        this.path = d3.geoPath().projection(d3.geoTransform({
            point: function(x, y) {
                const point = map.latLngToLayerPoint(new L.LatLng(y, x));
                this.stream.point(point.x, point.y);
            }
        }));

        // Re-project and redraw borough paths
        this.mapGroup.selectAll("path.borough")
            .attr("d", this.path);

        // Reposition tree points (if active)
        if (this.activeDatasetType === 'tree' && this.filteredData) {
            this.dataGroup.selectAll("circle")
                .attr("cx", d => {
                    const coords = [+d.longitude, +d.latitude];
                    if (isNaN(coords[0]) || isNaN(coords[1])) return null;
                    const point = this.map.latLngToLayerPoint(L.latLng(coords[1], coords[0]));
                    return point.x;
                })
                .attr("cy", d => {
                    const coords = [+d.longitude, +d.latitude];
                     if (isNaN(coords[0]) || isNaN(coords[1])) return null;
                    const point = this.map.latLngToLayerPoint(L.latLng(coords[1], coords[0]));
                    return point.y;
                })
                .filter(function() { // Filter out circles with invalid positions
                    return d3.select(this).attr("cx") !== null && d3.select(this).attr("cy") !== null;
                 });
        }
        console.log("[MapComponent] D3 layer positions updated.");
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
        // Ensure the interaction layer (for boroughs) is removed when showing trees
        if (this.interactionLayer && this.map.hasLayer(this.interactionLayer)) {
            this.map.removeLayer(this.interactionLayer);
            console.log('[MapComponent - updateTreePoints] Removed interaction layer.');
        }

        if (!this.filteredData || !this.map) return;

        console.log("[MapComponent] Updating tree points...");

        const healthColorScale = (health) => {
            switch (health?.toLowerCase()) {
                case 'good': return '#4CAF50'; // Green
                case 'fair': return '#FF9800'; // Orange
                case 'poor': return '#F44336'; // Red
                default: return '#9E9E9E'; // Grey for unknown/other
            }
        };

        // Reset borough fills (ensure they are visible and have default colors)
        if (this.mapGroup && this.boroughData) {
            this.mapGroup.selectAll("path.borough")
                .interrupt()
                .attr("fill", d => {
                    const boroughName = d.properties.name;
                    return this.boroughData[boroughName]?.color || "#ccc";
                })
                .style("fill-opacity", null) // Reset fill-opacity (let CSS handle it)
                .style("opacity", 1) // Ensure main opacity is 1
                .style("display", null);
             console.log("[MapComponent - updateTreePoints] Reset borough fills.");
        } else {
             console.warn("[MapComponent - updateTreePoints] Could not reset borough fills.");
        }

        // Clear previous data points (circles)
        this.dataGroup.selectAll("circle").remove();

        // Add data points using Leaflet's coordinate conversion
        const circles = this.dataGroup.selectAll("circle")
            .data(this.filteredData.filter(d => d.latitude && d.longitude)) // Filter data with valid coordinates
            .enter()
            .append("circle")
            .attr("r", 3)
            .attr("fill", d => healthColorScale(d.status))
            .attr("opacity", 0.6)
            .on("mouseover", (event, d) => {
                const commonName = d.spc_common || 'Tree';
                const status = d.status || 'Unknown';
                const lat = d.latitude ? parseFloat(d.latitude).toFixed(4) : 'N/A';
                const lon = d.longitude ? parseFloat(d.longitude).toFixed(4) : 'N/A';
                this._updateTooltip(event, `<strong>${commonName}</strong><br/>Status: ${status}<br/>Coords: ${lat}, ${lon}`);
                d3.select(event.currentTarget).raise().attr('r', 5).attr('opacity', 0.9);
            })
            .on("mouseout", (event, d) => {
                this._hideTooltip();
                d3.select(event.currentTarget).attr('r', 3).attr('opacity', 0.6);
            })
            .on("click", (event, d) => {
                console.log("[MapComponent] Tree clicked:", d);
                this.onTreeClickCallbacks.forEach(callback => callback(d));
            });

        // Call updateD3LayerPositions to position the newly added circles correctly
        this.updateD3LayerPositions();
        console.log(`[MapComponent] Added ${circles.size()} tree points.`);
    }

    updateNoiseChoropleth() {
        // Ensure the interaction layer (for boroughs) is added when showing noise choropleth
        if (this.interactionLayer && !this.map.hasLayer(this.interactionLayer)) {
            this.interactionLayer.addTo(this.map);
            console.log('[MapComponent - updateNoiseChoropleth] Added interaction layer.');
        }

        if (!this.filteredData || !this.mapGroup || !this.boroughData) return;

        console.log("[MapComponent] Updating noise choropleth...");

        // Aggregate noise complaints by borough
        const noiseCounts = {};
        this.filteredData.forEach(item => {
            const borough = item['Borough'];
            if (borough) {
                noiseCounts[borough] = (noiseCounts[borough] || 0) + 1;
            }
        });

        // Define a helper to get noise count for tooltip/hover
        this.getNoiseCountForBorough = (boroughName) => noiseCounts[boroughName] || 0;

        // Find min/max counts for color scale domain
        const counts = Object.values(noiseCounts);
        const minCount = d3.min(counts) || 0;
        const maxCount = d3.max(counts) || 1;

        // Define a color scale
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([minCount, maxCount]);

        // Update borough fills based on noise counts
        this.mapGroup.selectAll("path.borough")
            .transition()
            .duration(500)
            .attr("fill", d => {
                const boroughName = d.properties.name;
                const count = noiseCounts[boroughName] || 0;
                return colorScale(count);
            })
            .style("fill-opacity", 0.7) // Reduce opacity for choropleth view
            .style("opacity", 1); // Keep main opacity at 1

        // Clear tree points if they exist
        this.dataGroup.selectAll("circle").remove();
         console.log("[MapComponent - updateNoiseChoropleth] Removed tree points.");


        // Update tooltip and hover behavior specifically for choropleth
        this.mapGroup.selectAll("path.borough")
             // Ensure existing listeners are removed before adding new ones to avoid conflicts
            .on("mouseover", null) // Remove generic mouseover added in loadGeoJson
            .on("mouseout", null)  // Remove generic mouseout
            .on("mouseover.choropleth", (event, d) => {
                const boroughName = d.properties.name;
                const count = noiseCounts[boroughName] || 0;
                this._updateTooltip(event, `<strong>${boroughName}</strong><br/>Noise Complaints: ${count}`);
                d3.select(event.currentTarget).raise().style("stroke-width", 1.5).style("stroke", "black"); // Highlight
                // Trigger hover callback (if needed, pass noise specific data)
                this.onBoroughHoverCallbacks.forEach(callback =>
                    callback(boroughName, { count: count }));
            })
            .on("mouseout.choropleth", (event, d) => {
                 this._hideTooltip();
                 d3.select(event.currentTarget).style("stroke-width", 0.5).style("stroke", "#fff"); // Reset style
            });
         console.log("[MapComponent] Updated borough interactions for choropleth.");
    }

    clearAllLayers() {
        console.log("[MapComponent] Clearing dynamic layers...");

        // Remove the interaction layer if it exists
        if (this.interactionLayer && this.map.hasLayer(this.interactionLayer)) {
            this.map.removeLayer(this.interactionLayer);
            console.log('[MapComponent - clearAllLayers] Removed interaction layer.');
        }

        // Remove data points (e.g., tree circles)
        if (this.dataGroup) {
             this.dataGroup.selectAll("circle").remove();
             console.log("[MapComponent] Removed circles from dataGroup.");
        }

        // Reset borough fills to their default colors and reset interaction events
        if (this.mapGroup && this.path && this.boroughData && this.geoJsonData) {
             // Remove choropleth-specific event listeners first
            this.mapGroup.selectAll("path.borough")
                .on(".choropleth", null) // Remove listeners in .choropleth namespace
                .interrupt() // Stop existing transitions (like fill transition)
                .transition() // Use transition for smooth visual reset (optional)
                .duration(100) // Short duration for reset
                .attr("fill", d => { // Reset fill to default
                    const boroughName = d.properties.name;
                    return this.boroughData[boroughName]?.color || "#ccc"; // Use stored borough data color
                })
                .style("fill-opacity", null) // Reset fill-opacity (let CSS handle it)
                .style("opacity", 1) // Reset main opacity
                .style("display", null); // Ensure paths are visible if hidden before

            // Re-attach generic hover/click listeners from loadGeoJson logic
            this.mapGroup.selectAll("path.borough")
                 .on("mouseover", (event, d) => {
                    const boroughName = d.properties.name;
                    // Show only borough name on hover when no specific data layer is active
                    this._updateTooltip(event, `<strong>${boroughName}</strong>`);
                    d3.select(event.currentTarget).raise().style("stroke-width", 1.5).style("stroke", "black");
                    // Optionally trigger hover callback with basic borough data
                    this.onBoroughHoverCallbacks.forEach(callback =>
                        callback(boroughName, this.boroughData[boroughName]));
                })
                .on("mouseout", (event, d) => {
                    this._hideTooltip();
                     d3.select(event.currentTarget).style("stroke-width", 0.5).style("stroke", "#fff"); // Reset style
                });

             console.log("[MapComponent] Reset borough path fills and interactions.");
        } else {
            console.log("[MapComponent] Cannot reset borough fills - mapGroup, path, boroughData, or geoJsonData missing?");
        }
        return this;
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