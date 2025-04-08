export class FilterPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.filters = [];
        this.onFilterChangeCallbacks = [];
    }
    
    initialize() {
        // Create basic filter structure
        this.container.innerHTML = `
            <div class="filter-header">
                <h3>Filter Data</h3>
                <button id="reset-filters">Reset</button>
            </div>
            <div id="filter-controls"></div>
        `;
        
        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        return this;
    }
    
    addFilter(filterConfig) {
        filterConfig.id = `filter-${this.filters.length}-${filterConfig.field}`;
        filterConfig.currentValue = filterConfig.defaultValue || ''; 
            
        this.filters.push(filterConfig);
        this.renderFilter(filterConfig);
        return this;
    }
    
    renderFilter(filterConfig) {
        const filterControls = document.getElementById('filter-controls');
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-item';
        
        const label = document.createElement('label');
        label.htmlFor = filterConfig.id;
        label.textContent = filterConfig.label;
        filterContainer.appendChild(label);
        
        let control;
        
        if (filterConfig.type === 'dropdown') {
            control = this.createDropdown(filterConfig);
        } else {
            control = document.createElement('div');
            control.textContent = 'Unsupported filter type';
            console.warn("Unsupported filter type added:", filterConfig.type);
        }
        
        filterContainer.appendChild(control);
        filterControls.appendChild(filterContainer);
    }
    
    createDropdown(config) {
        const select = document.createElement('select');
        select.id = config.id;
        
        if (!config.defaultValue) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select...';
            select.appendChild(defaultOption);
        }
        
        config.options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            if (option.value === config.currentValue) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });
        
        select.addEventListener('change', () => {
            config.currentValue = select.value;
            this.notifyFilterChange();
        });
        
        return select;
    }
    
    onFilterChange(callback) {
        this.onFilterChangeCallbacks.push(callback);
        return this;
    }
    
    notifyFilterChange() {
        const filterState = this.getFilterState();
        this.onFilterChangeCallbacks.forEach(callback => callback(filterState));
    }
    
    getFilterState() {
        return this.filters.map(f => ({
            field: f.field,
            value: f.currentValue,
            operator: f.operator || '=',
            type: f.type
        }));
    }
    
    resetFilters() {
        this.filters.forEach(filter => {
            filter.currentValue = filter.defaultValue || ''; 
                
            const element = document.getElementById(filter.id);
            if (element && element.tagName === 'SELECT') {
                 element.value = filter.currentValue;
            } else if (element) {
                console.warn("Trying to reset non-dropdown filter element:", element);
            }
        });
        
        this.notifyFilterChange();
    }
}