const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Business category mappings for Overpass API
const CATEGORY_TAGS = {
    // US-specific categories
    'plumber': ['shop=plumber', 'craft=plumber', 'trade=plumber', 'service=plumber'],
    'electrician': ['shop=electrician', 'craft=electrician', 'trade=electrician'],
    'hvac': ['shop=hvac', 'craft=hvac', 'trade=hvac', 'service=hvac'],
    'realtor': ['office=estate_agent', 'shop=estate_agent'],
    'insurance': ['office=insurance', 'shop=insurance'],
    
    // European-specific categories
    'pub': ['amenity=pub'],
    'chemist': ['shop=chemist'],
    'tobacconist': ['shop=tobacco'],
    'newsagent': ['shop=newsagent'],
    'butcher': ['shop=butcher'],
    
    // Common categories
    'restaurant': ['amenity=restaurant'],
    'cafe': ['amenity=cafe'],
    'bar': ['amenity=bar'],
    'supermarket': ['shop=supermarket'],
    'bakery': ['shop=bakery'],
    'pharmacy': ['amenity=pharmacy', 'healthcare=pharmacy'],
    'doctor': ['healthcare=doctor', 'amenity=doctors'],
    'dentist': ['healthcare=dentist', 'amenity=dentist'],
    'bank': ['amenity=bank'],
    'hotel': ['tourism=hotel'],
    'school': ['amenity=school'],
    'gym': ['leisure=fitness_centre', 'leisure=sports_centre'],
    'car_repair': ['shop=car_repair', 'craft=car_repair'],
    'hairdresser': ['shop=hairdresser'],
    'clothing': ['shop=clothes', 'shop=clothing'],
    'bookstore': ['shop=books'],
};

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Search endpoint
app.get('/api/search', async (req, res) => {
    const { query, lat, lon, radius = 10000 } = req.query;
    
    try {
        // Get the tags for the selected category
        const categoryTags = CATEGORY_TAGS[query] || [];
        if (categoryTags.length === 0) {
            return res.status(400).json({ error: 'Invalid business category' });
        }

        // Build the Overpass query
        const tagQueries = categoryTags.map(tag => {
            const [key, value] = tag.split('=');
            return `nwr["${key}"="${value}"](around:${radius},${lat},${lon});`;
        }).join('\n');

        const overpassQuery = `
            [out:json][timeout:25];
            (
                ${tagQueries}
            );
            out body;
            >;
            out skel qt;
        `;

        console.log('Executing Overpass query:', overpassQuery);

        const response = await axios.post('https://overpass-api.de/api/interpreter', 
            overpassQuery,
            { 
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 30000 // 30 second timeout
            }
        );

        // Process and clean the results
        const results = response.data.elements.map(element => {
            const tags = element.tags || {};
            return {
                type: element.type,
                id: element.id,
                lat: element.lat || (element.center ? element.center.lat : null),
                lon: element.lon || (element.center ? element.center.lon : null),
                tags: {
                    name: tags.name,
                    'addr:street': tags['addr:street'],
                    'addr:housenumber': tags['addr:housenumber'],
                    'addr:city': tags['addr:city'],
                    'addr:postcode': tags['addr:postcode'],
                    'addr:state': tags['addr:state'],
                    phone: tags.phone || tags['contact:phone'],
                    website: tags.website || tags['contact:website'],
                    opening_hours: tags.opening_hours,
                    'contact:email': tags['contact:email'] || tags.email,
                    description: tags.description,
                    brand: tags.brand,
                    operator: tags.operator,
                    rating: tags.rating,
                    stars: tags.stars
                }
            };
        }).filter(result => 
            // Only filter out results without coordinates or name
            result.lat && result.lon && result.tags.name
        );

        console.log(`Found ${results.length} results for category: ${query}`);

        res.json({
            success: true,
            count: results.length,
            elements: results
        });

    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ 
            error: 'Error performing search',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 