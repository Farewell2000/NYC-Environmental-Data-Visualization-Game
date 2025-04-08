export async function loadData(url) {
    try {
        if (url.endsWith('.json')) {
            const response = await fetch(url);
            return await response.json();
        } else if (url.endsWith('.csv')) {
            return await d3.csv(url);
        }
    } catch (error) {
        console.error('Failed to load data from:', url, error);
        return null;
    }
}

export function processData(rawData, options) {
    // Process based on options.type
    if (options.type === 'aggregate') {
        // Aggregate data
        return aggregateData(rawData, options.groupBy, options.measure);
    } else if (options.type === 'filter') {
        // Filter data
        return filterData(rawData, options.filters);
    }
    
    return rawData;
}

function aggregateData(data, groupByField, measureField) {
    const result = {};
    
    data.forEach(item => {
        const groupKey = item[groupByField];
        if (!result[groupKey]) {
            result[groupKey] = 0;
        }
        result[groupKey] += +item[measureField];
    });
    
    return Object.entries(result).map(([key, value]) => ({
        [groupByField]: key,
        [measureField]: value
    }));
}

function filterData(data, filters) {
    return data.filter(item => {
        return filters.every(filter => {
            const value = item[filter.field];
            switch (filter.operator) {
                case '=': return value == filter.value;
                case '>': return value > filter.value;
                case '<': return value < filter.value;
                case '>=': return value >= filter.value;
                case '<=': return value <= filter.value;
                case 'includes': return value.includes(filter.value);
                default: return true;
            }
        });
    });
}