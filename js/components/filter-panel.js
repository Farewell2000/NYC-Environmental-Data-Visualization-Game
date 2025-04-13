export class FilterPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.filters = [];
        this.onFilterChangeCallbacks = [];
        this.filterDefinitions = {}; // Store filter configs by name/type
        this.activeFilterSetName = null; // Track which set of filters is active
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

    addFilterDefinition(setName, filterConfig) {
        if (!this.filterDefinitions[setName]) {
            this.filterDefinitions[setName] = [];
        }
        filterConfig.id = `filter-${setName}-${filterConfig.field}`;
        filterConfig.currentValue = filterConfig.defaultValue || '';
        this.filterDefinitions[setName].push(filterConfig);
        return this;
    }

    setActiveFilterSet(setName) {
        this.activeFilterSetName = setName;
        this.filters = this.filterDefinitions[setName] || []; // Use the stored definition
        this.renderActiveFilters();
        return this;
    }

    renderActiveFilters() {
        const filterControls = document.getElementById('filter-controls');
        filterControls.innerHTML = ''; // Clear existing controls

        if (!this.filters || this.filters.length === 0) {
            filterControls.textContent = 'No filters available for this task.';
            return;
        }

        this.filters.forEach(filterConfig => {
            this.renderFilter(filterConfig, filterControls);
        });
    }

    renderFilter(filterConfig, parentContainer) {
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
        parentContainer.appendChild(filterContainer); // Append to the provided container
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
            this.notifyFilterChange(config.field, select.value);
        });

        return select;
    }

    onFilterChange(callback) {
        this.onFilterChangeCallbacks.push(callback);
        return this;
    }

    notifyFilterChange(field, value) {
        console.log(`[FilterPanel] Notifying change: Set=${this.activeFilterSetName}, Field=${field}, Value=${value}`);
        this.onFilterChangeCallbacks.forEach(callback => callback(this.activeFilterSetName, field, value));
    }

    resetFilters() {
        if (!this.filters) return; // Check if filters exist for the active set

        this.filters.forEach(filter => {
            const previousValue = filter.currentValue;
            const resetValue = filter.defaultValue || '';
            filter.currentValue = resetValue;

            const element = document.getElementById(filter.id);
            if (element && element.tagName === 'SELECT') {
                element.value = filter.currentValue;
            }

            if (previousValue !== resetValue) {
                this.notifyFilterChange(filter.field, filter.currentValue);
            }
        });
    }
}