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
        console.log('[MapComponent] Cleared existing borough paths');

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
                const color = this.boroughData[boroughName]?.color || "#ccc";
                console.log(`[MapComponent] Setting borough ${boroughName} fill to ${color}`);
                return color;
            })
            .style("fill-opacity", 0.65); // Set semi-transparency for all boroughs
            /* Remove initial generic hover listeners
            .on("mouseover", (event, d) => {
                const boroughName = d.properties.name;
                const boroughData = this.boroughData[boroughName] || this.additionalData['noise']?.find(item => item.Borough === boroughName); // Find relevant data
                let content = `<strong>${boroughName}</strong>`;
                 // Ensure getNoiseCountForBorough exists before calling
                 if (this.activeDatasetType === 'noise' && typeof this.getNoiseCountForBorough === 'function') {
                    const count = this.getNoiseCountForBorough(boroughName);
                    content += `<br/>Noise Complaints: ${count}`;
                } else if (this.activeDatasetType === 'noise') {
                    console.warn("[MapComponent - loadGeoJson hover] getNoiseCountForBorough not defined yet.");
                }
                this._updateTooltip(event, content);
                d3.select(event.currentTarget).raise().style("stroke-width", 1.5).style("stroke", "black").style("fill-opacity", 0.85); // Bring to front and highlight
            })
            .on("mouseout", (event, d) => {
                this._hideTooltip();
                d3.select(event.currentTarget).style("stroke-width", 0.5).style("stroke", "#fff").style("fill-opacity", 0.65); // Reset style
            });
            */

        console.log(`[MapComponent] Created ${feature.size()} borough path elements with transparency`);

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

        // Reposition borough labels (if active) and scale with zoom
        if (this.activeDatasetType === 'noise') {
            // Calculate font size based on zoom level
            const currentZoom = this.map.getZoom();
            // Base font size at zoom level 10
            const baseFontSize = 10;
            // Scale font size based on zoom level
            const fontSize = this.calculateFontSizeByZoom(currentZoom);
            
            this.mapGroup.selectAll("text.borough-label")
                .attr("transform", d => {
                    const centroid = this.path.centroid(d); // Use the updated path
                    if (isNaN(centroid[0]) || isNaN(centroid[1])) {
                        return "translate(-9999, -9999)"; // Hide if centroid invalid
                    }
                    return `translate(${centroid[0]}, ${centroid[1]})`;
                })
                .style("font-size", `${fontSize}px`);
        }
        
        console.log("[MapComponent] D3 layer positions updated.");
    }

    // Helper method to calculate font size based on zoom level
    calculateFontSizeByZoom(zoom) {
        // Further increased base font size for better visibility
        const baseFontSize = 14; 
        // Adjusted scaling factors
        if (zoom >= 12) {
            // Slightly increase font size when zooming in
            return baseFontSize + (zoom - 12) * 2.5; // Increased multiplier
        } else if (zoom <= 9) {
            // Decrease font size when zooming out, but ensure minimum size
            return Math.max(9, baseFontSize - (9 - zoom) * 2); // Increased min size
        }
        // Default size for intermediate zoom levels (e.g., 10-11)
        return baseFontSize; 
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
        // Remove borough labels if they exist
        this.mapGroup.selectAll("text.borough-label").remove();
        console.log('[MapComponent - updateTreePoints] Removed borough labels.');

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
            console.log("[MapComponent - updateTreePoints] Resetting borough fills to original colors");
            this.mapGroup.selectAll("path.borough")
                .interrupt()
                // .each(function(d) { // Removed logging each borough fill
                //     const boroughName = d.properties.name;
                //     const color = d3.select(this).attr("fill"); 
                //     console.log(`[MapComponent] Borough ${boroughName} current fill: ${color}`);
                // })
                .attr("fill", d => {
                    const boroughName = d.properties.name;
                    const color = this.boroughData[boroughName]?.color || "#ccc";
                    // console.log(`[MapComponent] Resetting borough ${boroughName} fill to ${color}`); // Reduced verbosity
                    return color;
                })
                .style("fill-opacity", 0.85) // MAKE BOROUGHS MORE TRANSPARENT FOR TREE TASKS
                .style("opacity", 1) // Ensure main opacity is 1
                .style("display", null);
            console.log("[MapComponent - updateTreePoints] Borough fills reset complete with reduced opacity");
        } else {
             console.warn("[MapComponent - updateTreePoints] Could not reset borough fills.");
        }

        // Clear previous data points (circles)
        this.dataGroup.selectAll("circle").remove();

        // Calculate radius based on zoom level
        const calculateRadius = () => {
            const currentZoom = this.map.getZoom();
            // Base radius at zoom level 12
            const baseRadius = 3;
            // Scale up when zoomed in, scale down when zoomed out
            if (currentZoom >= 12) {
                // Gradually increase size when zooming in
                return baseRadius * (1 + (currentZoom - 12) * 0.3);
            } else {
                // Gradually decrease size when zooming out
                return Math.max(1, baseRadius * (1 - (12 - currentZoom) * 0.2));
            }
        };
        
        // Initial radius
        let radius = calculateRadius();

        // Add data points using Leaflet's coordinate conversion
        const circles = this.dataGroup.selectAll("circle")
            .data(this.filteredData.filter(d => d.latitude && d.longitude)) // Filter data with valid coordinates
            .enter()
            .append("circle")
            .attr("r", radius)
            .attr("fill", d => healthColorScale(d.status))
            .attr("opacity", 0.6)
            .on("mouseover", (event, d) => {
                const commonName = d.spc_common || 'Tree';
                const status = d.status || 'Unknown';
                const lat = d.latitude ? parseFloat(d.latitude).toFixed(4) : 'N/A';
                const lon = d.longitude ? parseFloat(d.longitude).toFixed(4) : 'N/A';
                this._updateTooltip(event, `<strong>${commonName}</strong><br/>Status: ${status}<br/>Coords: ${lat}, ${lon}`);
                d3.select(event.currentTarget).raise().attr('r', radius * 1.5).attr('opacity', 0.9);
            })
            .on("mouseout", (event, d) => {
                this._hideTooltip();
                d3.select(event.currentTarget).attr('r', radius).attr('opacity', 0.6);
            })
            .on("click", (event, d) => {
                console.log("[MapComponent] Tree clicked:", d);
                this.onTreeClickCallbacks.forEach(callback => callback(d));
            });

        // Update circle radius on zoom
        this.map.on("zoomend", () => {
            radius = calculateRadius();
            this.dataGroup.selectAll("circle")
                .attr("r", radius);
        });

        // Call updateD3LayerPositions to position the newly added circles correctly
        this.updateD3LayerPositions();
        console.log(`[MapComponent] Added ${circles.size()} tree points.`);
    }

    updateNoiseChoropleth(selectedNoiseType) {
        // Ensure the interaction layer (for boroughs) is added when showing noise choropleth
        if (this.interactionLayer && !this.map.hasLayer(this.interactionLayer)) {
            this.interactionLayer.addTo(this.map);
            console.log('[MapComponent - updateNoiseChoropleth] Added interaction layer.');
        } else if (!this.interactionLayer) {
             console.warn('[MapComponent - updateNoiseChoropleth] Interaction layer not initialized.');
        }

        const fullNoiseData = this.additionalData['noise'];
        if (!fullNoiseData || !this.mapGroup || !this.boroughData || !this.geoJsonData) { // Added geoJsonData check
             console.warn("[MapComponent - updateNoiseChoropleth] Missing required data or elements.");
             return;
        }

        console.log(`[MapComponent] Updating noise choropleth for type: ${selectedNoiseType || 'All'}...`);

        // Filter data based on the selected noise type
        const dataToAggregate = (selectedNoiseType === 'All' || !selectedNoiseType)
            ? fullNoiseData
            : fullNoiseData.filter(item => item['Complaint Type'] === selectedNoiseType);

        // Aggregate noise complaints by borough using the filtered data
        const noiseCounts = {};
        this.geoJsonData.features.forEach(feature => {
            noiseCounts[feature.properties.name] = 0; // Initialize all boroughs with 0 count
        });
        dataToAggregate.forEach(item => {
            const borough = item['Borough'];
            if (borough && noiseCounts.hasOwnProperty(borough)) { // Ensure borough exists in GeoJSON
                noiseCounts[borough] = (noiseCounts[borough] || 0) + 1;
            }
        });

        // Find min/max counts for color scale domain
        const counts = Object.values(noiseCounts);
        const minCount = d3.min(counts) ?? 0; // Use ?? for nullish coalescing
        const maxCount = d3.max(counts) ?? 1; // Use ?? for nullish coalescing (ensure at least 1 for domain)

        console.log(`[MapComponent] Noise counts - Min: ${minCount}, Max: ${maxCount}`);

        // Define a helper to get noise count for tooltip/hover
        this.getNoiseCountForBorough = (boroughName) => noiseCounts[boroughName] || 0;

        // Define choropleth colors (RED GRADIENT - consistent with legend)
        // Use a sequential color scale
        const redGradientColors = ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'];

        // Create a color scale based on noise data values
        // Use scaleSequential for a continuous mapping or scaleQuantile/Quantize for discrete buckets
        const colorScale = d3.scaleSequential()
            .domain([minCount, maxCount > minCount ? maxCount : minCount + 1]) // Ensure domain has range > 0
            .interpolator(d3.interpolateRgbBasis(redGradientColors)); // Interpolate across the red gradient

        // Clear tree points
        this.dataGroup.selectAll("circle").remove();
        console.log("[MapComponent] Removed tree points for noise visualization");

        // Apply choropleth colors based on noise data
        this.mapGroup.selectAll("path.borough").each((d, i, nodes) => {
            const boroughName = d.properties.name;
            const element = nodes[i];
            const count = noiseCounts[boroughName] || 0;
            // Get color from the sequential scale
            const color = (count > 0 || maxCount === 0) ? colorScale(count) : '#FFFFFF'; // Use white for 0 count if max > 0

            d3.select(element)
                .transition() // Add a smooth transition
                .duration(300)
                .attr('fill', color)
                .style('fill-opacity', 0.75) // Set desired opacity for noise
                .style('opacity', 1); // Ensure path itself is opaque

            // console.log(`[MapComponent] Borough ${boroughName}: ${count} complaints, color ${color}`); // Reduced verbosity
        });

        // Add/Update Borough Labels for Noise Task
        this.mapGroup.selectAll("text.borough-label").remove(); // Clear existing labels first
        // Calculate initial font size based on current zoom
        const currentZoom = this.map.getZoom();
        const fontSize = this.calculateFontSizeByZoom(currentZoom);
        
        this.mapGroup.selectAll("text.borough-label")
            .data(this.geoJsonData.features)
            .enter()
            .append("text")
            .attr("class", "borough-label")
            .attr("transform", d => {
                // Use centroid for label positioning
                const centroid = this.path.centroid(d);
                if (isNaN(centroid[0]) || isNaN(centroid[1])) {
                    console.warn(`[MapComponent] Invalid centroid for ${d.properties.name}`);
                    return "translate(-9999, -9999)"; // Move off-screen
                }
                return `translate(${centroid[0]}, ${centroid[1]})`;
            })
            .attr("text-anchor", "middle")
            .attr("dy", ".35em") // Vertical alignment
            .text(d => d.properties.name)
            .style("font-size", `${fontSize}px`) // Set initial font size based on zoom
            .style("fill", "#333")
            .style("font-weight", "bold") // Make labels bold
            .style("paint-order", "stroke") // Ensure stroke is drawn behind fill
            .style("stroke", "#ffffff") // Add white stroke
            .style("stroke-width", "0.5px") // Stroke width
            .style("stroke-linecap", "butt")
            .style("stroke-linejoin", "miter")
            .style("pointer-events", "none") // Prevent labels from interfering with clicks
            .style("opacity", 0);
            
        // Fade in labels
        this.mapGroup.selectAll("text.borough-label")
            .transition()
            .duration(300)
            .style("opacity", 1);

        console.log("[MapComponent] Added/Updated borough labels for noise task.");

        // Remove D3 hover listeners previously added to visual paths
        this.mapGroup.selectAll("path.borough")
            .on("mouseover", null)
            .on("mouseout", null);

        // Bind Leaflet tooltips to the invisible interaction layer
        if (this.interactionLayer) {
            this.interactionLayer.eachLayer(layer => {
                const boroughName = layer.feature.properties.name;
                // Define tooltip content function
                const tooltipContentFn = () => {
                    // Ensure getNoiseCountForBorough is accessible and updated
                    const count = (typeof this.getNoiseCountForBorough === 'function') 
                                    ? this.getNoiseCountForBorough(boroughName) 
                                    : 0;
                     console.log(`[MapComponent - Tooltip Fn] Borough: ${boroughName}, Count: ${count}`); // Debug log inside function
                    return `<strong>${boroughName}</strong><br/>Noise Complaints: ${count}`;
                };

                // Unbind previous tooltip first, then bind new one
                layer.unbindTooltip(); 
                layer.bindTooltip(tooltipContentFn, { 
                    sticky: true, // Tooltip follows the mouse
                    direction: 'top', // Show above the cursor
                    offset: L.point(0, -10) // Adjust position slightly
                });
            });
            console.log("[MapComponent] Bound Leaflet tooltips to interaction layer.");
        } else {
            console.warn("[MapComponent] Cannot bind tooltips: interactionLayer is missing.");
        }

        console.log("[MapComponent] Noise choropleth update complete - data-driven colors applied");
    }

    clearAllLayers() {
        console.log("[MapComponent] Clearing dynamic layers...");

        // Remove the interaction layer if it exists and unbind its tooltips
        if (this.interactionLayer) {
             if (this.map.hasLayer(this.interactionLayer)) {
                 this.map.removeLayer(this.interactionLayer);
                 console.log('[MapComponent - clearAllLayers] Removed interaction layer.');
             }
             // Ensure tooltips are unbound even if layer wasn't on map
             this.interactionLayer.eachLayer(layer => layer.unbindTooltip());
             console.log('[MapComponent - clearAllLayers] Unbound tooltips from interaction layer.');
         }

        // Remove data points (e.g., tree circles)
        if (this.dataGroup) {
             this.dataGroup.selectAll("circle").remove();
             console.log("[MapComponent] Removed circles from dataGroup.");
        }
        
        // Remove borough labels
        if (this.mapGroup) {
            this.mapGroup.selectAll("text.borough-label").remove();
            console.log("[MapComponent] Removed borough labels.");
        }

        // Reset borough fills to their default colors and reset interaction events
        if (this.mapGroup && this.path && this.boroughData && this.geoJsonData) {
             // Remove choropleth-specific event listeners first
            this.mapGroup.selectAll("path.borough")
                .on("mouseover", null)
                .on("mouseout", null)
                .interrupt() // Stop existing transitions (like fill transition)
                .transition() // Use transition for smooth visual reset (optional)
                .duration(100) // Short duration for reset
                .attr("fill", d => { // Reset fill to default
                    const boroughName = d.properties.name;
                    return this.boroughData[boroughName]?.color || "#ccc"; // Use stored borough data color
                })
                .style("fill-opacity", 0.95) // RESET to default semi-transparency
                .style("opacity", 1) // Reset main opacity
                .style("display", null); // Ensure paths are visible if hidden before

            // Remove the problematic re-attachment of generic listeners
            /* 
             // Re-attach generic hover/click listeners from loadGeoJson logic
             this.mapGroup.selectAll("path.borough")
                  .on("mouseover", (event, d) => {
                     const boroughName = d.properties.name;
                     // Show only borough name on hover when no specific data layer is active
                     this._updateTooltip(event, `<strong>${boroughName}</strong>`);
                     d3.select(event.currentTarget).raise().style("stroke-width", 1.5).style("stroke", "black");
                 })
                 .on("mouseout", (event, d) => {
                     this._hideTooltip();
                      d3.select(event.currentTarget).style("stroke-width", 0.5).style("stroke", "#fff"); // Reset style
                 });
            */

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

    _updateTooltip(event, content) {
        console.log(`[MapComponent - _updateTooltip] Updating tooltip. Content: ${content}`); // DEBUG LOG
        this.tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        this.tooltip.html(content)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        console.log(`[MapComponent - _updateTooltip] Tooltip style applied:`, this.tooltip.node().style.cssText); // DEBUG LOG
    }

    _hideTooltip() {
        console.log(`[MapComponent - _hideTooltip] Hiding tooltip.`); // DEBUG LOG
        this.tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }
}