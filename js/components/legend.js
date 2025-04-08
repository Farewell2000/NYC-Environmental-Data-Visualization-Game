export class Legend {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
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
        this.initialize(legendData);
    }
}