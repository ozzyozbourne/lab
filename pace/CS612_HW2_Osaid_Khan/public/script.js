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
        const airportList = document.getElementById('airline-airports-list');
        const routeList = document.getElementById('airline-routes-list');

        try {
            const routeData = await fetchData(`/airline/routes?code=${airlineCode}`);

            const airlineInfo = document.createElement('li');
            airlineInfo.classList.add('airline-info');
            airlineInfo.innerHTML = `<strong>${routeData.airline.name}</strong> (${routeData.airline.iata}/${routeData.airline.icao})`;
            routeList.appendChild(airlineInfo);

            const separator = document.createElement('li');
            separator.classList.add('separator');
            routeList.appendChild(separator);

            // Display routes
            routeData.routes.forEach(route => {
                const li = document.createElement('li');
                li.innerHTML = `
                <div class="route-item">
                    <div class="route-airports">
                        ${route.departure_code} → ${route.arrival_code}
                    </div>
                    <div class="route-details">
                        ${route.departure_airport} (${route.departure_city}) to 
                        ${route.arrival_airport} (${route.arrival_city})
                    </div>
                    <div class="route-aircraft">
                        Aircraft: ${route.planes}
                    </div>
                </div>
            `;
                routeList.appendChild(li);
            });

            const uniqueAirports = new Map();
            routeData.routes.forEach(route => {
                if (!uniqueAirports.has(route.departure_code)) {
                    uniqueAirports.set(route.departure_code, {
                        code: route.departure_code,
                        name: route.departure_airport,
                        city: route.departure_city,
                        country: route.departure_country
                    });
                }

                if (!uniqueAirports.has(route.arrival_code)) {
                    uniqueAirports.set(route.arrival_code, {
                        code: route.arrival_code,
                        name: route.arrival_airport,
                        city: route.arrival_city,
                        country: route.arrival_country
                    });
                }
            });

            const airportHeader = document.createElement('li');
            airportHeader.classList.add('airport-header');
            airportHeader.innerHTML = `<strong>Airports served by ${routeData.airline.name}</strong>`;
            airportList.appendChild(airportHeader);

            const airportSeparator = document.createElement('li');
            airportSeparator.classList.add('separator');
            airportList.appendChild(airportSeparator);

            const sortedAirports = Array.from(uniqueAirports.values())
                .sort((a, b) => a.code.localeCompare(b.code));

            sortedAirports.forEach(airport => {
                const li = document.createElement('li');
                li.innerHTML = `
                <div class="airport-item">
                    <strong>${airport.code}</strong> - ${airport.name}
                    <div class="airport-location">${airport.city}, ${airport.country}</div>
                </div>
            `;
                airportList.appendChild(li);
            });

        } catch (error) {
            airportList.innerHTML = `<li>Error: ${error.message}</li>`;
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
