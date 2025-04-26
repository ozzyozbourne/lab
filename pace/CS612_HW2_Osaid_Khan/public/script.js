document.addEventListener('DOMContentLoaded', function() {
    let airportMap = null;
    const countrySelect = document.getElementById('country-select');
    const airlineSelect = document.getElementById('airline-select');
    const airportSelect = document.getElementById('airport-select');

    const departureAirportSelect = document.getElementById('departure-airport');
    const arrivalAirportSelect = document.getElementById('arrival-airport');

    setupEventListeners();

    function setupEventListeners() {
        document.getElementById('load-country-data').addEventListener('click', loadCountryData);
        document.getElementById('load-airline-data').addEventListener('click', loadAirlineData);
        document.getElementById('load-airport-data').addEventListener('click', loadAirportData);
        document.getElementById('load-departures').addEventListener('click', loadDepartingRoutes);
        document.getElementById('load-arrivals').addEventListener('click', loadArrivingRoutes);
        document.getElementById('load-airlines').addEventListener('click', loadAirportAirlines);
        document.getElementById('get-route-details').addEventListener('click', getRouteDetails);
    }


    async function loadCountryData() {
        const countryCode = countrySelect.value;
        if (!countryCode) {
            alert('Please select a country');
            return;
        }
        const airlinesList = document.getElementById('airlines-list');
        const airportsList = document.getElementById('airports-list');
        try {
            const airlines = await fetchData(`/airlines?country=${countryCode}`);
            const airports = await fetchData(`/airports?country=${countryCode}`);

            if (airlines.length === 0) {
                airlinesList.innerHTML = '<li>No airlines found</li>';
                return;
            }

            if (airports.length === 0) {
                airportsList.innerHTML = '<li>No airports found</li>';
                return;
            }

            airlinesList.innerHTML = '';
            airlines.forEach(airline => {
                const li = document.createElement('li');
                li.textContent = airline.name;
                airlinesList.appendChild(li);
            });

            airportsList.innerHTML = '';
            airports.forEach(airport => {
                const li = document.createElement('li');
                li.textContent = `${airport.name} (${airport.iata}) - ${airport.city}`;
                airportsList.appendChild(li);
            });

        } catch (error) {
            airlinesList.innerHTML = `<li>Error: ${error.message}</li>`;
            airportsList.innerHTML = `<li>Error: ${error.message}</li>`;
        }
    }

    async function loadAirlineData() {
        const airlineCode = airlineSelect.value;
        if (!airlineCode) {
            alert('Please select an airline');
            return;
        }
        const routeList = document.getElementById('airline-routes-list');
        routeList.innerHTML = '<li>Loading...</li>';

        try {
            const routeData = await fetchData(`/airline/routes?code=${airlineCode}`);
            routeList.innerHTML = '';

            const tablesContainer = document.createElement('div');

            const airlineTable = document.createElement('table');
            airlineTable.className = 'airline-info-table';

            const airlineCaption = document.createElement('caption');
            airlineCaption.textContent = 'Airline Information';
            airlineTable.appendChild(airlineCaption);

            let headerRow = document.createElement('tr');
            for (const key in routeData.airline) {
                const th = document.createElement('th');
                th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                headerRow.appendChild(th);
            }
            airlineTable.appendChild(headerRow);

            const dataRow = document.createElement('tr');
            for (const key in routeData.airline) {
                const td = document.createElement('td');
                td.textContent = routeData.airline[key];
                dataRow.appendChild(td);
            }
            airlineTable.appendChild(dataRow);

            tablesContainer.appendChild(airlineTable);

            const routesTable = document.createElement('table');
            routesTable.className = 'routes-table';

            const routesCaption = document.createElement('caption');
            routesCaption.textContent = 'Routes';
            routesTable.appendChild(routesCaption);

            const routesHeader = document.createElement('thead');
            headerRow = document.createElement('tr');

            const routeColumns = [
                { key: 'departure_code', label: 'From' },
                { key: 'arrival_code', label: 'To' },
                { key: 'departure_airport', label: 'Departure Airport' },
                { key: 'arrival_airport', label: 'Arrival Airport' },
                { key: 'planes', label: 'Aircraft' }
            ];

            routeColumns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = column.label;
                headerRow.appendChild(th);
            });

            routesHeader.appendChild(headerRow);
            routesTable.appendChild(routesHeader);

            const routesBody = document.createElement('tbody');

            routeData.routes.forEach(route => {
                const row = document.createElement('tr');

                routeColumns.forEach(column => {
                    const td = document.createElement('td');

                    if (column.key === 'departure_airport') {
                        td.textContent = `${route.departure_airport}, ${route.departure_city}, ${route.departure_country}`;
                    }
                    else if (column.key === 'arrival_airport') {
                        td.textContent = `${route.arrival_airport}, ${route.arrival_city}, ${route.arrival_country}`;
                    }
                    else {
                        td.textContent = route[column.key];
                    }

                    row.appendChild(td);
                });

                routesBody.appendChild(row);
            });

            routesTable.appendChild(routesBody);

            tablesContainer.appendChild(routesTable);

            routeList.appendChild(tablesContainer);

        } catch (error) {
            routeList.innerHTML = `<li>Error: ${error.message}</li>`;
        }
    }

    async function loadAirportData() {
        const airportCode = airportSelect.value;
        if (!airportCode) {
            alert('Please select an airport');
            return;
        }

        try {
            document.getElementById('airport-info').innerHTML = 'Loading...';
            document.getElementById('weather-info').innerHTML = 'Loading...';

            const airportData = await fetchData(`/airport?iata=${airportCode}`);

            displayAirportDetails(airportData);
            displayWeatherInfo(airportData);
            displayAirportMap(airportData);
        } catch (error) {
            document.getElementById('airport-info').innerHTML = `Error: ${error.message}`;
            document.getElementById('weather-info').innerHTML = `Error: ${error.message}`;
        }
    }

    // Function to display the airport on a map
    function displayAirportMap(airport) {
        // If map container exists
        const mapContainer = document.getElementById('airport-map');
        if (!mapContainer) return;

        // If map is already initialized, remove it first
        if (airportMap) {
            airportMap.remove();
            airportMap = null;
        }

        // Check if we have valid coordinates
        if (!airport.latitude || !airport.longitude) {
            mapContainer.innerHTML = '<p>Map coordinates not available</p>';
            return;
        }

        // Initialize map
        airportMap = L.map('airport-map').setView([airport.latitude, airport.longitude], 12);

        // Add the OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(airportMap);

        // Add a marker for the airport
        const marker = L.marker([airport.latitude, airport.longitude]).addTo(airportMap);

        // Add a popup with airport information
        marker.bindPopup(`
        <h4>${airport.name} (${airport.iata})</h4>
        <p>${airport.city}, ${airport.country}</p>
    `).openPopup();

        // Force map to recalculate its size (helps with display issues)
        setTimeout(() => {
            airportMap.invalidateSize();
        }, 100);
    }

    function displayAirportDetails(airport) {
        const airportInfo = document.getElementById('airport-info');

        const details = `
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span>${airport.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">City:</span>
            <span>${airport.city}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Country:</span>
            <span>${airport.country}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">IATA Code:</span>
            <span>${airport.iata}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">ICAO Code:</span>
            <span>${airport.icao}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Latitude:</span>
            <span>${airport.latitude}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Longitude:</span>
            <span>${airport.longitude}</span>
        </div>
        `;

        airportInfo.innerHTML = details;
    }

    function displayWeatherInfo(airport) {
        const weatherInfo = document.getElementById('weather-info');

        if (airport.high && airport.low) {
            const weather = `
            <div class="detail-row">
                <span class="detail-label">Today's High:</span>
                <span class="weather-highlight">${airport.high}°C</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Today's Low:</span>
                <span class="weather-highlight">${airport.low}°C</span>
            </div>
            `;
            weatherInfo.innerHTML = weather;
        } else {
            weatherInfo.innerHTML = '<p>Weather information not available</p>';
        }
    }

    async function loadDepartingRoutes() {
        const airportCode = document.querySelector('#airport-select-route').value;
        if (!airportCode) {
            alert('Please select an airport');
            return;
        }

        try {
            document.getElementById('routes-title').textContent = `Departing Routes from ${airportCode}`;
            document.getElementById('routes-list').innerHTML = '<li>Loading...</li>';

            const routes = await fetchData(`/routes/arrivals?departure=${airportCode}`);
            displayRoutes(routes);
        } catch (error) {
            document.getElementById('routes-list').innerHTML = `<li>Error: ${error.message}</li>`;
        }
    }

    async function loadArrivingRoutes() {
        const airportCode = document.querySelector('#airport-select-route').value;
        if (!airportCode) {
            alert('Please select an airport');
            return;
        }

        try {
            document.getElementById('routes-title').textContent = `Arriving Routes to ${airportCode}`;
            document.getElementById('routes-list').innerHTML = '<li>Loading...</li>';

            const routes = await fetchData(`/routes/departures?arrival=${airportCode}`);
            displayRoutes(routes);
        } catch (error) {
            document.getElementById('routes-list').innerHTML = `<li>Error: ${error.message}</li>`;
        }
    }

    async function loadAirportAirlines() {
        const airportCode = document.querySelector('#airport-select-route').value;
        if (!airportCode) {
            alert('Please select an airport');
            return;
        }

        try {
            document.getElementById('routes-title').textContent = `Airlines Flying To/From ${airportCode}`;
            document.getElementById('routes-list').innerHTML = '<li>Loading...</li>';

            const airlines = await fetchData(`/airport/airlines?airport=${airportCode}`);
            displayAirlines(airlines);
        } catch (error) {
            document.getElementById('routes-list').innerHTML = `<li>Error: ${error.message}</li>`;
        }
    }

    function displayRoutes(routes) {
        const routesList = document.getElementById('routes-list');

        if (routes.length === 0) {
            routesList.innerHTML = '<li>No routes found</li>';
            return;
        }

        routesList.innerHTML = '';
        routes.forEach(route => {
            const li = document.createElement('li');
            li.textContent = `${route.name} (${route.iata || route.icao}) - ${route.city}, ${route.country}`;
            routesList.appendChild(li);
        });
    }

    function displayAirlines(airlines) {
        const routesList = document.getElementById('routes-list');

        if (airlines.length === 0) {
            routesList.innerHTML = '<li>No airlines found</li>';
            return;
        }

        routesList.innerHTML = '';
        airlines.forEach(airline => {
            const li = document.createElement('li');
            li.textContent = `${airline.name} (${airline.iata || airline.icao}) - ${airline.callsign || ''} - ${airline.country}`;
            routesList.appendChild(li);
        });
    }

    function displayAirlines(airlines) {
        const routesList = document.getElementById('routes-list');
        if (airlines.length === 0) {
            routesList.innerHTML = '<li>No airlines found</li>';
            return;
        }

        routesList.innerHTML = '';
        airlines.forEach(airline => {
            const li = document.createElement('li');
            li.textContent = `${airline.name} (${airline.iata || airline.icao}) - ${airline.country}`;
            routesList.appendChild(li);
        });
    }

    async function getRouteDetails() {
        const departureCode = departureAirportSelect.value;
        const arrivalCode = arrivalAirportSelect.value;

        if (!departureCode || !arrivalCode) {
            alert('Please select both departure and arrival airports');
            return;
        }

        if (departureCode === arrivalCode) {
            alert('Please select different airports for departure and arrival');
            return;
        }

        try {
            document.getElementById('between-title').textContent = `Route Details: ${departureCode} to ${arrivalCode}`;
            document.getElementById('between-content').innerHTML = 'Loading...';
            const routeData = await fetchData(`/routes?departure=${departureCode}&arrival=${arrivalCode}`);

            displayRouteDetails(routeData);
        } catch (error) {
            document.getElementById('between-content').innerHTML = `Error: ${error.message}`;
        }
    }

    function displayRouteDetails(routeData) {
        const contentDiv = document.getElementById('between-content');

        let html = `
    <div class="detail-row">
        <span class="detail-label">From:</span>
        <span>${routeData.departure.name} (${routeData.departure.code})</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">To:</span>
        <span>${routeData.arrival.name} (${routeData.arrival.code})</span>
    </div>
    <div class="detail-row">
        <span class="detail-label">Distance:</span>
        <span class="weather-highlight">${routeData.distance} ${routeData.unit}</span>
    </div>`;

        if (routeData.routes && routeData.routes.length > 0) {
            html += '<div class="detail-row"><span class="detail-label">Airlines:</span></div>';
            html += '<ul class="data-list">';

            routeData.routes.forEach(route => {
                html += `<li><strong>${route.airline.trim()}</strong> - Aircraft: ${route.aircraft_types.join(', ')}</li>`;
            });

            html += '</ul>';
        } else {
            html += '<div class="detail-row"><span class="detail-label">Airlines:</span><span>No airlines found for this route</span></div>';
        }
        contentDiv.innerHTML = html;
    }

    async function fetchData(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}: `, error);
            throw error;
        }
    }
});
