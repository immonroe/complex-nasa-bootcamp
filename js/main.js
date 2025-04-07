document.addEventListener('DOMContentLoaded', async function() {
    // Map initialization with zoom control at bottom right
    const map = L.map('map', {
        zoomControl: false 
    }).setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // NASA icon
    const nasaIcon = L.icon({
        iconUrl: 'https://img.icons8.com/color/48/nasa.png',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        className: 'nasa-marker-icon'
    });

    const searchInput = document.getElementById('search');
    const showAllBtn = document.getElementById('show-all');
    const resultsContainer = document.getElementById('results');
    const loadingElement = document.getElementById('loading');
    
    let allFacilities = [];
    let markers = [];
    let currentDisplayMode = 'all';

    async function init() {
        try {
            loadingElement.textContent = "Loading NASA facilities...";
            
            const response = await fetch('https://data.nasa.gov/resource/gvk9-iz74.json');
            let facilities = await response.json();
            
            facilities = removeDuplicates(facilities);
            allFacilities = await processFacilityLocations(facilities);
            createAllMarkers(true);
            setupSearch();
            
            loadingElement.textContent = `Loaded ${allFacilities.length} NASA facilities`;
            setTimeout(() => {
                loadingElement.style.opacity = '0';
                setTimeout(() => loadingElement.style.display = "none", 300);
            }, 2000);
            
        } catch (error) {
            console.error("Error:", error);
            loadingElement.innerHTML = `<span style="color: var(--nasa-red)">Error loading data. Please try again later.</span>`;
        }
    }

    function removeDuplicates(facilities) {
        const uniqueMap = new Map();
        facilities.forEach(facility => {
            const key = `${facility.center || facility.facility}-${facility.location?.latitude}-${facility.location?.longitude}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, facility);
            }
        });
        return Array.from(uniqueMap.values());
    }

    async function processFacilityLocations(facilities) {
        return await Promise.all(facilities.map(async facility => {
            let lat, lon, locationType;
            
            if (facility.location?.latitude && facility.location?.longitude) {
                lat = parseFloat(facility.location.latitude);
                lon = parseFloat(facility.location.longitude);
                locationType = 'exact';
            } else {
                const coords = await geocodeLocation(facility.city, facility.state, facility.country);
                lat = coords?.lat || 0;
                lon = coords?.lon || 0;
                locationType = coords ? 'approximate' : 'unknown';
            }
            
            return {
                ...facility,
                displayName: `${facility.center || facility.facility} - ${facility.city}, ${facility.state}`,
                searchText: `${facility.center} ${facility.facility} ${facility.city} ${facility.state} ${facility.country}`.toLowerCase(),
                lat,
                lon,
                locationType
            };
        }));
    }

    async function geocodeLocation(city, state, country) {
        if (!city) return null;
        try {
            const query = [city, state, country].filter(Boolean).join(', ');
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
            );
            const results = await response.json();
            return results[0] ? {
                lat: parseFloat(results[0].lat),
                lon: parseFloat(results[0].lon)
            } : null;
        } catch (e) {
            console.warn("Geocoding failed for", city, state);
            return null;
        }
    }

    function createAllMarkers(visible) {
        clearAllMarkers();
        markers = allFacilities.map(facility => {
            const marker = L.marker([facility.lat, facility.lon], {
                icon: nasaIcon,
                opacity: visible ? 1 : 0,
                riseOnHover: true
            }).addTo(map);
            bindPopupContent(marker, facility);
            return marker;
        });
        if (visible && allFacilities.length > 0) zoomToAllVisible();
    }

    function clearAllMarkers() {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
    }

    function bindPopupContent(marker, facility) {
        let popupContent = `
            <div class="facility-info">
                <h3>${facility.center || facility.facility || 'Unknown Facility'}</h3>
                <p>${[facility.city, facility.state, facility.country].filter(Boolean).join(', ')}</p>
        `;
        
        if (facility.locationType === 'approximate') {
            popupContent += `<p><em>Approximate location (city center)</em></p>`;
        } else if (facility.locationType === 'unknown') {
            popupContent += `<p><em>Location unknown</em></p>`;
        }
        
        popupContent += `</div>`;
        marker.bindPopup(popupContent);
        
        marker.on('popupopen', async () => {
            if (facility.locationType !== 'unknown') {
                const weather = await fetchWeather(facility.lat, facility.lon);
                if (weather) {
                    const popup = marker.getPopup();
                    popup.setContent(popup.getContent() + `
                        <div class="weather-display">
                            <img src="https:${weather.current.condition.icon}" width="20" alt="Weather icon">
                            ${weather.current.temp_f}°F - ${weather.current.condition.text}
                        </div>
                    `);
                }
            }
        });
    }

    function setupSearch() {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (searchTerm.length < 2) {
                resultsContainer.innerHTML = '';
                return;
            }
            const results = allFacilities.filter(facility => 
                facility.searchText.includes(searchTerm)
            );
            displaySearchResults(results);
        });
        
        showAllBtn.addEventListener('click', () => {
            currentDisplayMode = 'all';
            createAllMarkers(true);
            searchInput.value = '';
            resultsContainer.innerHTML = '';
        });
    }

    function displaySearchResults(results) {
        resultsContainer.innerHTML = '';
        currentDisplayMode = 'search';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="result-item">No NASA facilities found</div>';
            hideAllMarkers();
            return;
        }
        
        updateMarkerVisibility(results);
        
        results.slice(0, 50).forEach(facility => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.textContent = facility.displayName;
            resultItem.addEventListener('click', () => {
                zoomToFacility(facility);
            });
            resultsContainer.appendChild(resultItem);
        });
        
        zoomToVisibleMarkers();
    }

    function updateMarkerVisibility(visibleFacilities) {
        markers.forEach((marker, index) => {
            const shouldShow = visibleFacilities.includes(allFacilities[index]);
            marker.setOpacity(shouldShow ? 1 : 0);
        });
    }

    function zoomToFacility(facility) {
        map.setView([facility.lat, facility.lon], 12);
        markers[allFacilities.indexOf(facility)].openPopup();
    }

    function zoomToVisibleMarkers() {
        const visibleMarkers = markers.filter(marker => marker.options.opacity > 0);
        if (visibleMarkers.length > 0) {
            const group = new L.featureGroup(visibleMarkers);
            map.fitBounds(group.getBounds().pad(0.2));
        }
    }

    function zoomToAllVisible() {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
    }

    function hideAllMarkers() {
        markers.forEach(marker => marker.setOpacity(0));
    }

    async function fetchWeather(lat, lon) {
        try {
            const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=4c455336721b4765a08175859252603&q=${lat},${lon}`
            );
            return await response.json();
        } catch (error) {
            console.warn("Weather API error:", error);
            return null;
        }
    }

    init();
});