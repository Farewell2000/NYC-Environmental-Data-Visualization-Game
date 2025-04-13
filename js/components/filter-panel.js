export class FilterPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.filters = [];
        this.onFilterChangeCallbacks = [];
        this.filterDefinitions = {}; // Store filter configs by name/type
        this.activeFilterSetName = null; // Track which set of filters is active
        this.currentFilterValues = {}; // Store current values for the active set
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
        filterContainer.dataset.field = filterConfig.field; // Add data attribute for field

        const label = document.createElement('label');
        label.htmlFor = filterConfig.id;
        label.textContent = filterConfig.label;
        filterContainer.appendChild(label);

        let control;

        if (filterConfig.type === 'dropdown') {
            control = this.createDropdown(filterConfig);
        } else if (filterConfig.type === 'checkbox-group') { // Add checkbox group support
            control = this.createCheckboxGroup(filterConfig);
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
            this.updateCurrentValue(config.field, select.value);
            this.notifyFilterChange(); // Notify with all current values
        });

        return select;
    }

    // New method for creating checkbox groups
    createCheckboxGroup(config) {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'checkbox-group';
        config.currentValue = config.currentValue || []; // Initialize as array if needed

        config.options.forEach(option => {
            const checkboxId = `${config.id}-${option.value}`;
            const wrapper = document.createElement('div');
            wrapper.className = 'checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.value = option.value;
            checkbox.checked = config.currentValue.includes(option.value); // Check if value is in current selection

            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            label.textContent = option.label;

            checkbox.addEventListener('change', () => {
                const selectedValues = Array.from(groupContainer.querySelectorAll('input[type="checkbox"]:checked'))
                                            .map(cb => cb.value);
                config.currentValue = selectedValues; // Update the config's current value
                this.updateCurrentValue(config.field, selectedValues);
                this.notifyFilterChange(); // Notify with all current values
            });

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            groupContainer.appendChild(wrapper);
        });

        return groupContainer;
    }

    onFilterChange(callback) {
        this.onFilterChangeCallbacks.push(callback);
        return this;
    }

    notifyFilterChange() {
        console.log(`[FilterPanel] Notifying change for set: ${this.activeFilterSetName}`, this.getCurrentFilterValues());
        // Pass the set name and the complete set of current values
        this.onFilterChangeCallbacks.forEach(callback => callback(this.activeFilterSetName, this.getCurrentFilterValues()));
    }

    // Helper to get all current values for the active set
    getCurrentFilterValues() {
        const values = {};
        if (this.filters) {
            this.filters.forEach(filter => {
                values[filter.field] = filter.currentValue;
            });
        }
        return values;
    }

     // Helper to update internal state (optional but good practice)
     updateCurrentValue(field, value) {
        const filterConfig = this.filters.find(f => f.field === field);
        if (filterConfig) {
            filterConfig.currentValue = value;
        }
         // Optionally update this.currentFilterValues directly if needed elsewhere
         // this.currentFilterValues[field] = value;
     }

    resetFilters() {
        if (!this.filters) return; // Check if filters exist for the active set

        let needsNotify = false;

        this.filters.forEach(filter => {
            const previousValue = filter.currentValue;
            const resetValue = filter.defaultValue || '';
            filter.currentValue = resetValue;

            const element = document.getElementById(filter.id);
            if (element) {
                if (element.tagName === 'SELECT') {
                    element.value = filter.currentValue;
                } else if (filter.type === 'checkbox-group') { // Handle checkbox reset
                    const groupContainer = element.closest('.filter-item')?.querySelector('.checkbox-group');
                     if (groupContainer) {
                         groupContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                             cb.checked = filter.currentValue.includes(cb.value);
                         });
                     }
                }
            }

            if (JSON.stringify(previousValue) !== JSON.stringify(resetValue)) { // Use JSON.stringify for array comparison
                 // Don't notify per filter, notify once after all resets
                 needsNotify = true;
            }
        });

        if (needsNotify) {
             this.notifyFilterChange(); // Notify once after resetting all applicable filters
        }
    }
}