export class Legend {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`[Legend] Container element with ID '${containerId}' not found!`);
        }
    }
    
    initialize(legendData) {
        this.container.innerHTML = '';
        
        for (const title in legendData) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'legend-section';
            
            const titleElement = document.createElement('h4');
            titleElement.className = 'legend-title';
            titleElement.textContent = title;
            sectionDiv.appendChild(titleElement);
            
            legendData[title].forEach(item => {
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';
                
                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color';
                colorBox.style.backgroundColor = item.color;
                
                const label = document.createElement('div');
                label.className = 'legend-label';
                label.textContent = item.label;
                
                legendItem.appendChild(colorBox);
                legendItem.appendChild(label);
                sectionDiv.appendChild(legendItem);
            });
            
            this.container.appendChild(sectionDiv);
        }
    }
    
    update(legendData) {
        if (!this.container) return;
        this.container.innerHTML = ''; // Clear existing legend

        if (!legendData || Object.keys(legendData).length === 0) {
            console.warn("[Legend] No legend data provided or data is empty.");
            this.container.style.display = 'none';
            return;
        }

        this.container.style.display = 'block'; // Ensure container is visible

        for (const title in legendData) {
            const sectionData = legendData[title];
            const sectionDiv = document.createElement('div');
            sectionDiv.classList.add('legend-section');

            const titleElement = document.createElement('div');
            titleElement.classList.add('legend-title');
            titleElement.textContent = title;
            sectionDiv.appendChild(titleElement);

            // Check if this section is a gradient
            if (sectionData && sectionData.type === 'gradient') {
                const gradientContainer = document.createElement('div');
                gradientContainer.classList.add('legend-gradient-container');

                const gradientBar = document.createElement('div');
                gradientBar.classList.add('legend-gradient-bar');
                // Create CSS gradient string from the colors array
                const gradientColors = sectionData.colors.join(', ');
                gradientBar.style.background = `linear-gradient(to right, ${gradientColors})`;

                const labelContainer = document.createElement('div');
                labelContainer.classList.add('legend-gradient-labels');

                const minLabel = document.createElement('span');
                minLabel.textContent = sectionData.minLabel || 'Min';
                const maxLabel = document.createElement('span');
                maxLabel.textContent = sectionData.maxLabel || 'Max';

                labelContainer.appendChild(minLabel);
                labelContainer.appendChild(maxLabel);

                gradientContainer.appendChild(gradientBar);
                gradientContainer.appendChild(labelContainer);
                sectionDiv.appendChild(gradientContainer);

            } else if (Array.isArray(sectionData)) {
                // Existing logic for discrete items
                sectionData.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('legend-item');

                    const colorBox = document.createElement('div');
                    colorBox.classList.add('legend-color');
                    colorBox.style.backgroundColor = item.color;

                    const label = document.createElement('span');
                    label.classList.add('legend-label');
                    label.textContent = item.label;

                    itemDiv.appendChild(colorBox);
                    itemDiv.appendChild(label);
                    sectionDiv.appendChild(itemDiv);
                });
            } else {
                 console.warn(`[Legend] Unexpected data format for section: ${title}`, sectionData);
            }

            this.container.appendChild(sectionDiv);
        }
    }
}