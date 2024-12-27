# Business Lead Finder

A web-based tool that helps freelancers and digital agencies find potential clients by identifying businesses without websites but with contact information. The tool uses OpenStreetMap data to locate businesses within a specified radius and filters them based on their digital presence.

## 🌟 Features

- Search businesses within a 200km radius
- Multi-select business categories
- Progressive radius search (25km, 50km, 100km, 200km)
- Filter results by contact method (email/phone)
- Real-time search statistics
- Interactive map integration
- Location autocomplete
- Mobile-responsive design



## 🛠️ Technology Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- Leaflet.js for mapping
- OpenStreetMap & Overpass API
- Nominatim for geocoding

## 📋 Prerequisites

- A modern web browser
- Node.js (for local development server)
- Basic understanding of HTML/CSS/JavaScript

## 🔧 Installation

1. Clone the repository:
bash
git clone https://github.com/trulynotafan/Client_Finder.git
2. Navigate to the project directory:
cd business finder
3. Install dependencies:
npm install
4. Start the development server:
node src/server.js

## 💡 Usage

1. Enter a location in the search box
2. Select one or more business categories
3. Choose your desired search radius (1-200km)
4. Select contact method filters (email/phone)
5. Click "Search" to find potential clients
6. View results with contact information

## 🔍 How It Works

The application uses a chunked search approach to efficiently query the Overpass API:

1. Breaks down large radius searches into smaller chunks (25km, 50km, etc.)
2. Queries each business category separately to avoid memory issues
3. Filters out businesses that already have websites
4. Identifies businesses with contact information
5. Removes duplicates and presents clean results

## 🎯 Key Features Explained

### Progressive Search
- Implements radius-based chunking to handle large areas
- Shows real-time progress and statistics
- Manages API rate limiting and memory constraints

### Contact Filtering
- Checks multiple tag variations for emails and phones
- Filters out businesses with existing websites
- Supports multiple contact method combinations

### Data Processing
- Removes duplicate entries
- Validates contact information
- Formats and displays business details clearly

## 📝 Configuration

You can modify the following parameters in `script.js`



## 👏 Acknowledgments

- OpenStreetMap contributors for the data
- Overpass API for the query interface
- Leaflet.js for mapping functionality
- Nominatim for geocoding services



## 🚨 Important Notes

- Respect API rate limits
- Use responsibly and ethically
- Consider local privacy laws when collecting contact information
- Always follow proper business outreach etiquette

---

Made with ❤️ by [Afaan]

