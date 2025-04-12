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
