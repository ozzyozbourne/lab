document.addEventListener('DOMContentLoaded', function() {
    const baseUrl = '/';

    const countryInput = document.getElementById('country-select');
    const airlineInput = document.getElementById('airline-select');
    const airportInput = document.getElementById('airport-select');
    const routeAirportInput = document.getElementById('route-airport-select');
    const departureAirportInput = document.getElementById('departure-airport');
    const arrivalAirportInput = document.getElementById('arrival-airport');

    setupEventListeners();

    function setupEventListeners() {
        document.getElementById('load-country-data').addEventListener('click', loadCountryData);
        document.getElementById('load-airline-data').addEventListener('click', loadAirlineData);
        document.getElementById('load-airport-data').addEventListener('click', loadAirportData);
        document.getElementById('load-departures').addEventListener('click', loadDepartingRoutes);
        document.getElementById('load-arrivals').addEventListener('click', loadArrivingRoutes);
        document.getElementById('load-airlines').addEventListener('click', loadAirportAirlines);
        document.getElementById('find-airlines').addEventListener('click', findAirlinesBetweenAirports);
        document.getElementById('calculate-distance').addEventListener('click', calculateDistance);
    }

    function getAirportCode(airportInput) {
        const match = airportInput.match(/\(([A-Z]{3})\)$/);
        if (match) return match[1];
        if (/^[A-Z]{3}$/.test(airportInput)) return airportInput;
        return airportInput;
    }

    async function loadCountryData() {
        const countryCode = countryInput.value.trim();
        if (!countryCode) {
            alert('Please enter a country');
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
        const airlineCode = airlineInput.value.trim();
        if (!airlineCode) {
            alert('Please enter an airline code (e.g., AA for American Airlines)');
            return;
        }
        const routeList = document.getElementById('airline-routes-list');
        routeList.innerHTML = '<li>Loading...</li>';

        try {
            const routeData = await fetchData(`/airline/routes?code=${airlineCode}`);
            routeList.innerHTML = '';

            // Create container for tables
            const tablesContainer = document.createElement('div');

            // Create airline info table
            const airlineTable = document.createElement('table');
            airlineTable.className = 'airline-info-table';

            // Add airline table caption
            const airlineCaption = document.createElement('caption');
            airlineCaption.textContent = 'Airline Information';
            airlineTable.appendChild(airlineCaption);

            // Create header row
            let headerRow = document.createElement('tr');
            for (const key in routeData.airline) {
                const th = document.createElement('th');
                th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                headerRow.appendChild(th);
            }
            airlineTable.appendChild(headerRow);

            // Create data row
            const dataRow = document.createElement('tr');
            for (const key in routeData.airline) {
                const td = document.createElement('td');
                td.textContent = routeData.airline[key];
                dataRow.appendChild(td);
            }
            airlineTable.appendChild(dataRow);

            // Add airline table to container
            tablesContainer.appendChild(airlineTable);

            // Create routes table
            const routesTable = document.createElement('table');
            routesTable.className = 'routes-table';

            // Add routes table caption
            const routesCaption = document.createElement('caption');
            routesCaption.textContent = 'Routes';
            routesTable.appendChild(routesCaption);

            // Create routes table header
            const routesHeader = document.createElement('thead');
            headerRow = document.createElement('tr');

            // Define the columns we want to show in the routes table
            const routeColumns = [
                { key: 'departure_code', label: 'From' },
                { key: 'arrival_code', label: 'To' },
                { key: 'departure_airport', label: 'Departure Airport' },
                { key: 'arrival_airport', label: 'Arrival Airport' },
                { key: 'planes', label: 'Aircraft' }
            ];

            // Create header cells
            routeColumns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = column.label;
                headerRow.appendChild(th);
            });

            routesHeader.appendChild(headerRow);
            routesTable.appendChild(routesHeader);

            // Create routes table body
            const routesBody = document.createElement('tbody');

            // Add rows for each route
            routeData.routes.forEach(route => {
                const row = document.createElement('tr');

                routeColumns.forEach(column => {
                    const td = document.createElement('td');

                    // Special handling for departure/arrival airport cells to include city and country
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

            // Add routes table to container
            tablesContainer.appendChild(routesTable);

            // Add tables container to the page
            routeList.appendChild(tablesContainer);

        } catch (error) {
            routeList.innerHTML = `<li>Error: ${error.message}</li>`;
        }
    }

    async function loadAirportData() {
        const airportValue = airportInput.value.trim();
        if (!airportValue) {
            alert('Please enter an airport');
            return;
        }

        try {
            document.getElementById('airport-info').innerHTML = 'Loading...';
            document.getElementById('weather-info').innerHTML = 'Loading...';

            // Use the input or extracted code
            const airportCode = getAirportCode(airportValue);

            const airportData = await fetchData(`/ airport ? iata = ${airportCode}`);

            displayAirportDetails(airportData);
            displayWeatherInfo(airportData);
        } catch (error) {
            document.getElementById('airport-info').innerHTML = `Error: ${error.message}`;
            document.getElementById('weather-info').innerHTML = `Error: ${error.message}`;
        }
    }

    function displayAirportDetails(airport) {
        const airportInfo = document.getElementById('airport-info');

        const details = `
        < div class= "detail-row" >
                <span class="detail-label">Name:</span>
                <span>${airport.name}</span>
            </div >
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
            < div class= "detail-row" >
                    <span class="detail-label">Today's High:</span>
                    <span class="weather-highlight">${airport.high}°C</span>
                </div >
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
        const airportValue = routeAirportInput.value.trim();
        if (!airportValue) {
            alert('Please enter an airport');
            return;
        }

        try {
            // Use the input or extracted code
            const airportCode = getAirportCode(airportValue);

            document.getElementById('routes-title').textContent = `Departing Routes from ${airportCode}`;
            document.getElementById('routes-list').innerHTML = '<li>Loading...</li>';

            const routes = await fetchData(`/ routes / arrivals ? departure = ${airportCode}`);
            displayRoutes(routes);
        } catch (error) {
            document.getElementById('routes-list').innerHTML = `< li > Error: ${error.message}</li > `;
        }
    }

    async function loadArrivingRoutes() {
        const airportValue = routeAirportInput.value.trim();
        if (!airportValue) {
            alert('Please enter an airport');
            return;
        }

        try {
            // Use the input or extracted code
            const airportCode = getAirportCode(airportValue);

            document.getElementById('routes-title').textContent = `Arriving Routes to ${airportCode}`;
            document.getElementById('routes-list').innerHTML = '<li>Loading...</li>';

            document.getElementById('routes-list').innerHTML =
                '<li>API limitation: There is no direct endpoint to get arriving routes.</li>' +
                '<li>In a complete implementation, we would need to query all routes and filter by arrival.</li>';
        } catch (error) {
            document.getElementById('routes-list').innerHTML = `< li > Error: ${error.message}</li > `;
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
            li.textContent = `${route.name}(${route.iata}) - ${route.city}, ${route.country}`;
            routesList.appendChild(li);
        });
    }

    async function loadAirportAirlines() {
        const airportValue = routeAirportInput.value.trim();
        if (!airportValue) {
            alert('Please enter an airport');
            return;
        }

        try {
            // Use the input or extracted code
            const airportCode = getAirportCode(airportValue);

            document.getElementById('routes-title').textContent = `Airlines Flying To / From ${airportCode}`;
            document.getElementById('routes-list').innerHTML = '<li>Loading...</li>';

            document.getElementById('routes-list').innerHTML =
                '<li>API limitation: There is no direct endpoint to get airlines by airport.</li>' +
                '<li>In a complete implementation, we would need to query all routes and extract unique airlines.</li>';
        } catch (error) {
            document.getElementById('routes-list').innerHTML = `< li > Error: ${error.message}</li > `;
        }
    }

    async function findAirlinesBetweenAirports() {
        const departureValue = departureAirportInput.value.trim();
        const arrivalValue = arrivalAirportInput.value.trim();

        if (!departureValue || !arrivalValue) {
            alert('Please enter both departure and arrival airports');
            return;
        }

        const departureCode = getAirportCode(departureValue);
        const arrivalCode = getAirportCode(arrivalValue);

        if (departureCode === arrivalCode) {
            alert('Please enter different airports for departure and arrival');
            return;
        }

        try {
            document.getElementById('between-title').textContent = `Airlines Flying from ${departureCode} to ${arrivalCode}`;
            document.getElementById('between-content').innerHTML = 'Loading...';

            const routeData = await fetchData(`/ routes ? departure = ${departureCode} & arrival=${arrivalCode}`);
            displayAirlinesBetweenAirports(routeData);
        } catch (error) {
            document.getElementById('between-content').innerHTML = `Error: ${error.message}`;
        }
    }

    function displayAirlinesBetweenAirports(routeData) {
        const contentDiv = document.getElementById('between-content');

        if (!routeData.routes || routeData.routes.length === 0) {
            contentDiv.innerHTML = '<p>No airlines found flying this route</p>';
            return;
        }

        let html = `< p > <strong>Distance:</strong> ${routeData.distance} ${routeData.unit}</p > `;
        html += '<ul class="data-list">';

        routeData.routes.forEach(route => {
            html += `< li > <strong>${route.airline.trim()}</strong> - Aircraft: ${route.aircraft_types.join(', ')}</li > `;
        });

        html += '</ul>';
        contentDiv.innerHTML = html;
    }

    async function calculateDistance() {
        const departureValue = departureAirportInput.value.trim();
        const arrivalValue = arrivalAirportInput.value.trim();

        if (!departureValue || !arrivalValue) {
            alert('Please enter both departure and arrival airports');
            return;
        }

        const departureCode = getAirportCode(departureValue);
        const arrivalCode = getAirportCode(arrivalValue);

        if (departureCode === arrivalCode) {
            alert('Please enter different airports for departure and arrival');
            return;
        }

        try {
            document.getElementById('between-title').textContent = `Distance from ${departureCode} to ${arrivalCode}`;
            document.getElementById('between-content').innerHTML = 'Calculating...';

            const routeData = await fetchData(`/ routes ? departure = ${departureCode} & arrival=${arrivalCode}`);
            displayDistance(routeData);
        } catch (error) {
            document.getElementById('between-content').innerHTML = `Error: ${error.message}`;
        }
    }

    function displayDistance(routeData) {
        const contentDiv = document.getElementById('between-content');

        const departureInfo = `${routeData.departure.name}(${routeData.departure.code})`;
        const arrivalInfo = `${routeData.arrival.name}(${routeData.arrival.code})`;

        const html = `
        < div class= "detail-row" >
                <span class="detail-label">From:</span>
                <span>${departureInfo}</span>
            </div >
            <div class="detail-row">
                <span class="detail-label">To:</span>
                <span>${arrivalInfo}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Distance:</span>
                <span class="weather-highlight">${routeData.distance} ${routeData.unit}</span>
            </div>
        `;

        contentDiv.innerHTML = html;
    }

    async function fetchData(endpoint) {
        try {
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
            const url = `${baseUrl}${cleanEndpoint}`;

            const response = await fetch(url);
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
