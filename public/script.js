let allResults = [];
let map;
let selectedLocations = [];

// Add a global variable for the search controller
let searchController = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    initializeMap();
    
    // Initialize event listeners
    initializeEventListeners();
});

// Add this new function for map initialization
function initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    try {
        // Initialize map with a default view
        map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

function initializeEventListeners() {
    console.log('Initializing event listeners'); // Debug log
    
    // Location input
    const locationInput = document.getElementById('location');
    if (locationInput) {
        console.log('Location input found, adding event listener'); // Debug log
        // Remove any existing listeners first
        locationInput.removeEventListener('input', debounce(handleLocationInput, 300));
        // Add the new listener
        locationInput.addEventListener('input', debounce(handleLocationInput, 300));
    } else {
        console.error('Location input not found');
    }

    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await searchBusinesses();
        });
    } else {
        console.error('Search form not found');
    }

    // Business type select
    const businessTypeSelect = document.getElementById('businessType');
    if (!businessTypeSelect) {
        console.error('Business type select not found');
    }

    // Add click outside listener to close suggestions
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#location') && !e.target.closest('#location-suggestions')) {
            const suggestions = document.getElementById('location-suggestions');
            if (suggestions) suggestions.remove();
        }
    });

    // Add download button event listener
    const downloadButton = document.getElementById('downloadJSON');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadJSON);
    }
}

// Add this helper function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update the handleLocationInput function with better debugging
async function handleLocationInput(e) {
    const query = e.target.value;
    console.log('Input value:', query); // Debug log

    if (query.length < 3) {
        console.log('Query too short, minimum 3 characters needed'); // Debug log
        let suggestions = document.getElementById('location-suggestions');
        if (suggestions) suggestions.remove();
        return;
    }

    try {
        console.log('Fetching suggestions for:', query); // Debug log
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
        console.log('Request URL:', url); // Debug log

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'BusinessFinder/1.0' // Add User-Agent header
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data); // Debug log

        if (data && data.length > 0) {
            createLocationSuggestions(data, e.target);
        } else {
            console.log('No suggestions found'); // Debug log
            let suggestions = document.getElementById('location-suggestions');
            if (suggestions) suggestions.remove();
        }
    } catch (error) {
        console.error('Error fetching locations:', error);
        let suggestions = document.getElementById('location-suggestions');
        if (suggestions) suggestions.remove();
    }
}

// Update the createLocationSuggestions function
function createLocationSuggestions(locations, input) {
    console.log('Creating suggestions for:', locations.length, 'locations');

    // Remove existing suggestions
    let existingSuggestions = document.getElementById('location-suggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    if (!locations.length) return;

    // Create suggestions container
    const suggestions = document.createElement('div');
    suggestions.id = 'location-suggestions';
    suggestions.className = 'location-suggestions';

    // Add suggestion items
    locations.forEach(location => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = location.display_name;
        
        item.addEventListener('click', () => {
            console.log('Suggestion clicked:', location);
            selectedLocations.push({
                name: location.display_name,
                lat: location.lat,
                lon: location.lon
            });
            
            input.value = '';
            updateSelectedLocationsDisplay();
            suggestions.remove();
            
            if (map) {
                const marker = L.marker([location.lat, location.lon])
                    .addTo(map)
                    .bindPopup(location.display_name);
                
                selectedLocations[selectedLocations.length - 1].marker = marker;
                
                if (selectedLocations.length > 0) {
                    const bounds = L.latLngBounds(selectedLocations.map(loc => [loc.lat, loc.lon]));
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            }
        });

        suggestions.appendChild(item);
    });

    // Get the form-group container of the input
    const formGroup = input.closest('.form-group');
    
    // Position suggestions relative to the form-group
    suggestions.style.position = 'absolute';
    suggestions.style.top = '100%'; // Position right below the input
    suggestions.style.left = '0';
    suggestions.style.width = '100%';
    suggestions.style.zIndex = '9999';

    // Append suggestions to the form-group instead of body
    formGroup.appendChild(suggestions);
    
    console.log('Suggestions added to form-group');
}

// Add new function to display selected locations
function updateSelectedLocationsDisplay() {
    let container = document.getElementById('selected-locations');
    if (!container) {
        container = document.createElement('div');
        container.id = 'selected-locations';
        container.className = 'selected-locations';
        const locationInput = document.getElementById('location');
        locationInput.parentNode.insertBefore(container, locationInput.nextSibling);
    }

    // Update the required attribute based on selected locations
    const locationInput = document.getElementById('location');
    if (locationInput) {
        locationInput.required = selectedLocations.length === 0;
    }

    container.innerHTML = selectedLocations.map((loc, index) => `
        <div class="selected-location">
            <span>${loc.name}</span>
            <button type="button" onclick="removeLocation(${index})" class="remove-location">×</button>
        </div>
    `).join('');
}

// Add function to remove a location
function removeLocation(index) {
    if (selectedLocations[index].marker) {
        map.removeLayer(selectedLocations[index].marker);
    }
    selectedLocations.splice(index, 1);
    updateSelectedLocationsDisplay();
    
    if (selectedLocations.length > 0) {
        const bounds = L.latLngBounds(selectedLocations.map(loc => [loc.lat, loc.lon]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Add these functions at the top level
function updateSearchStats(message) {
    const progressInfo = document.querySelector('.progress-info');
    if (progressInfo) {
        progressInfo.textContent = message;
    }
}

function updateResultsStats(totalFound, filtered, radius) {
    const resultsInfo = document.querySelector('.results-info');
    if (resultsInfo) {
        resultsInfo.innerHTML = `
            Found ${totalFound} total businesses within ${radius}km<br>
            ${filtered} businesses match your contact filters
        `;
    }
}

// Update the filterResults function
function filterResults(results) {
    const contactFilters = Array.from(document.getElementById('contactFilter').selectedOptions)
        .map(option => option.value);

    return results.filter(business => {
        if (!business || !business.tags) return false;
        
        const tags = business.tags;
        
        // Check for website variations
        const hasWebsite = [
            'website',
            'contact:website',
            'url',
            'homepage',
            'contact:homepage'
        ].some(tag => tag in tags);
        
        // Check for email variations
        const hasEmail = [
            'email',
            'contact:email',
            'mail',
            'contact:mail',
            'email:business',
            'contact:e-mail',
            'e-mail',
            'electronic-mail'
        ].some(tag => tag in tags);
        
        // Check for phone variations
        const hasPhone = [
            'phone',
            'contact:phone',
            'phone:mobile',
            'contact:mobile',
            'telephone',
            'contact:telephone',
            'phone:business'
        ].some(tag => tag in tags);

        // Apply contact filters
        const matchesContactFilter = contactFilters.includes('any') ||
            (contactFilters.includes('email') && hasEmail) ||
            (contactFilters.includes('phone') && hasPhone);

        // Must have a name, no website, and match contact filters
        return tags.name && !hasWebsite && matchesContactFilter;
    });
}

// Add this utility function for radius chunking
function getRadiusChunks(radius) {
    // Convert radius to meters (OSM uses meters)
    const radiusInMeters = radius * 1000;
    
    if (radiusInMeters <= 25000) {
        return [radiusInMeters];
    } else if (radiusInMeters <= 50000) {
        return [25000, radiusInMeters];
    } else if (radiusInMeters <= 100000) {
        return [25000, 50000, radiusInMeters];
    } else {
        return [25000, 50000, 100000, radiusInMeters];
    }
}

// Add HTML for the stop button (add this to your HTML file or create dynamically)
function addStopButton() {
    const existingButton = document.getElementById('stopSearch');
    if (!existingButton) {
        const button = document.createElement('button');
        button.id = 'stopSearch';
        button.className = 'stop-button';
        button.innerHTML = '⏹️ Stop Search';
        button.style.display = 'none';
        
        // Insert next to search button
        const searchButton = document.querySelector('.search-button');
        searchButton.parentNode.insertBefore(button, searchButton.nextSibling);
        
        button.addEventListener('click', stopSearch);
    }
}

// Function to stop the search
function stopSearch() {
    if (searchController) {
        searchController.abort();
        searchController = null;
    }
    document.getElementById('stopSearch').style.display = 'none';
    updateSearchStats('Search stopped by user');
}

// Add this function to check if a business matches the contact filters
function matchesContactFilters(tags) {
    const contactFilter = document.getElementById('contactFilter');
    const selectedFilters = Array.from(contactFilter.selectedOptions).map(option => option.value);
    
    // If "any" is selected, only check for having either email or phone
    if (selectedFilters.includes('any')) {
        return (tags.email || tags['contact:email'] || tags.phone || tags['contact:phone']) && 
               !(tags.website || tags['contact:website'] || tags.url);
    }

    // Check specific filters
    const hasEmail = selectedFilters.includes('email') ? 
        (tags.email || tags['contact:email']) : true;
    const hasPhone = selectedFilters.includes('phone') ? 
        (tags.phone || tags['contact:phone']) : true;

    // Must not have a website and must match all selected contact requirements
    return !(tags.website || tags['contact:website'] || tags.url) && 
           hasEmail && hasPhone;
}

// Update the searchBusinesses function
async function searchBusinesses() {
    try {
        if (selectedLocations.length === 0) {
            alert('Please select at least one location');
            return;
        }

        // Create new abort controller
        searchController = new AbortController();
        const signal = searchController.signal;

        // Show stop button
        addStopButton(); // Ensure the button exists
        document.getElementById('stopSearch').style.display = 'inline-block';

        const radiusKm = Math.min(Math.max(1, document.getElementById('radius').value), 200);
        const selectedTypes = Array.from(document.getElementById('businessType').selectedOptions)
            .map(option => option.value);

        if (selectedTypes.length === 0) {
            alert('Please select at least one business category');
            return;
        }

        // Initialize results container if it doesn't exist
        let businessList = document.getElementById('businessList');
        if (!businessList.querySelector('.results-container')) {
            businessList.innerHTML = '<div class="results-container"></div>';
        }
        const resultsContainer = businessList.querySelector('.results-container');

        let totalProcessed = 0;
        let uniqueIds = new Set();
        const radiusChunks = getRadiusChunks(radiusKm);

        // Enable JSON download button
        const downloadButton = document.getElementById('downloadJSON');
        if (downloadButton) {
            downloadButton.disabled = false;
            downloadButton.classList.add('active');
        }

        // Search for each selected location
        for (const location of selectedLocations) {
            if (signal.aborted) break;

            updateSearchStats(`Searching in ${location.name}...`);
            
            // Search each radius chunk
            for (const chunkRadius of radiusChunks) {
                if (signal.aborted) break;

                updateSearchStats(`Searching ${chunkRadius/1000}km radius in ${location.name}...`);
                
                // Search each business type
                for (const type of selectedTypes) {
                    if (signal.aborted) break;

                    try {
                        const overpassQuery = `
                            [out:json][timeout:90];
                            (
                                nwr["${type}"](around:${chunkRadius},${location.lat},${location.lon});
                            );
                            out body;
                            >;
                            out skel qt;
                        `;

                        const response = await fetch('https://overpass-api.de/api/interpreter', {
                            method: 'POST',
                            body: overpassQuery,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            signal // Add abort signal to fetch
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const data = await response.json();
                        const results = data.elements || [];
                        
                        // Process and display results in chunks
                        for (const result of results) {
                            if (signal.aborted) break;

                            // Skip if we've already processed this ID
                            if (uniqueIds.has(result.id)) continue;
                            uniqueIds.add(result.id);

                            const tags = result.tags || {};
                            
                            // Apply filters before creating element
                            if (!matchesContactFilters(tags)) continue;

                            // Create and append result element
                            const resultElement = createResultElement(result);
                            if (resultElement) {
                                resultsContainer.insertAdjacentHTML('beforeend', resultElement);
                                totalProcessed++;
                                
                                // Update count
                                updateResultCount(totalProcessed);
                            }
                        }

                        updateSearchStats(`Processed ${totalProcessed} businesses so far...`);
                        
                        // Add small delay between requests
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            console.log('Search aborted');
                            return;
                        }
                        console.error(`Error searching ${type} in ${location.name}:`, error);
                        continue;
                    }
                }
            }
        }

        // Hide stop button and update status
        document.getElementById('stopSearch').style.display = 'none';
        updateSearchStats(`Search complete! Found ${totalProcessed} businesses.`);

    } catch (error) {
        console.error('Search error:', error);
        updateSearchStats('Search failed. Please try again.');
    }
}

// Update the createResultElement function to include more contact information
function createResultElement(business) {
    const tags = business.tags || {};
    
    const name = tags.name || 'Unnamed business';
    const email = tags.email || tags['contact:email'] || '';
    const phone = tags.phone || tags['contact:phone'] || '';
    const category = tags.craft || tags.shop || tags.amenity || 'Unspecified';
    const address = [
        tags['addr:street'],
        tags['addr:housenumber'],
        tags['addr:postcode'],
        tags['addr:city'],
        tags['addr:country']
    ].filter(Boolean).join(' ');

    // Add contact method badges
    const contactBadges = [];
    if (email) contactBadges.push('<span class="badge email-badge">📧 Has Email</span>');
    if (phone) contactBadges.push('<span class="badge phone-badge">📞 Has Phone</span>');

    return `
        <div class="business-item" data-id="${business.id}">
            <h3>${name}</h3>
            <div class="contact-badges">
                ${contactBadges.join(' ')}
            </div>
            <div class="business-details">
                <p><strong>Category:</strong> ${category}</p>
                ${email ? `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>` : ''}
                ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
                ${address ? `<p><strong>Address:</strong> ${address}</p>` : ''}
            </div>
        </div>
    `;
}

// Helper function to update result count
function updateResultCount(count) {
    const countElement = document.getElementById('resultCount');
    if (countElement) {
        countElement.textContent = `Found ${count} businesses`;
    }
}

// Add a delay helper function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Add this function to collect displayed results
function collectDisplayedResults() {
    const resultsContainer = document.querySelector('.results-container');
    if (!resultsContainer) return [];

    const businessItems = resultsContainer.querySelectorAll('.business-item');
    return Array.from(businessItems).map(item => {
        // Helper function to extract text after the label
        const extractValue = (text) => {
            const element = Array.from(item.querySelectorAll('.business-details p'))
                .find(p => p.textContent.includes(text));
            return element ? 
                element.textContent.replace(`${text}:`, '').trim() : null;
        };

        // Extract email and phone from their links
        const emailLink = item.querySelector('a[href^="mailto:"]');
        const phoneLink = item.querySelector('a[href^="tel:"]');

        return {
            id: item.dataset.id,
            name: item.querySelector('h3')?.textContent || 'Unnamed',
            email: emailLink?.textContent || null,
            phone: phoneLink?.textContent || null,
            address: extractValue('Address'),
            category: extractValue('Category'),
            // Add any additional fields you want to include
            contactMethods: {
                hasEmail: !!emailLink,
                hasPhone: !!phoneLink
            }
        };
    });
}

// Update the downloadJSON function to only include business data
function downloadJSON() {
    try {
        const results = collectDisplayedResults();
        
        if (results.length === 0) {
            alert('No results to download');
            return;
        }

        // Just use the results array directly
        const jsonString = JSON.stringify(results, null, 2);
        
        // Create blob and download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Set download attributes
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `business-leads-${date}.json`;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error downloading results:', error);
        alert('Error downloading results. Please try again.');
    }
}

// Add this to make the export controls sticky
document.addEventListener('DOMContentLoaded', () => {
    const exportControls = document.querySelector('.export-controls');
    
    if (exportControls) {
        window.addEventListener('scroll', () => {
            const rect = exportControls.getBoundingClientRect();
            if (rect.top <= 20) {
                exportControls.classList.add('sticky');
            } else {
                exportControls.classList.remove('sticky');
            }
        });
    }
});

// Rest of your existing code...