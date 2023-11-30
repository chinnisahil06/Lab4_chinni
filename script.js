document.addEventListener('DOMContentLoaded', () => {
    const useGeoLocationButton = document.getElementById('use-geolocation');
    const searchLocationButton = document.getElementById('search-location');
    const locationSearchInput = document.getElementById('location-search');
    const errorMessage = document.getElementById('error-message'); // Assuming an error message element

    useGeoLocationButton.addEventListener('click', useCurrentLocation);
    searchLocationButton.addEventListener('click', () => searchLocation(locationSearchInput.value));

    function useCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            displayError("Geolocation is not supported by this browser.");
        }
    }

    function showPosition(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        fetchSunData(latitude, longitude);
    }

    function searchLocation(location) {
        const geocodeApiUrl = `https://geocode.maps.co/?q=${encodeURIComponent(location)}`;
        console.log("Geocode API URL: ", geocodeApiUrl); // Debugging: Log the API URL

        fetch(geocodeApiUrl)
            .then(response => response.json())
            .then(data => {
                console.log("Geocode API Response: ", data); // Debugging: Log the API response
                if (data.length === 0) {
                    displayError('Location not found.');
                    return;
                }
                const latitude = data[0].lat;
                const longitude = data[0].lon;
                fetchSunData(latitude, longitude);
            })
            .catch(error => {
                console.error('Geocode API Fetch Error:', error);
                displayError('Error fetching location data.');
            });
    }

    function fetchSunData(latitude, longitude) {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayFormatted = formatDate(today);
        const tomorrowFormatted = formatDate(tomorrow);

        const apiUrlToday = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${todayFormatted}&formatted=0`;
        const apiUrlTomorrow = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${tomorrowFormatted}&formatted=0`;

        Promise.all([fetch(apiUrlToday), fetch(apiUrlTomorrow)])
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(([dataToday, dataTomorrow]) => {
                displaySunData(dataToday.results, 'today');
                displaySunData(dataTomorrow.results, 'tomorrow');
            })
            .catch(() => displayError('Error fetching sunrise and sunset data.'));

            fetchTimeZoneData(latitude, longitude);
    }

    function fetchTimeZoneData(latitude, longitude) {
        const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        const timezoneApiUrl = `https://maps.googleapis.com/maps/api/timezone/json?location=${latitude},${longitude}&timestamp=${timestamp}&key=YOUR_GOOGLE_API_KEY`;
    
        fetch(timezoneApiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'OK') {
                    document.getElementById('today-timezone').textContent = data.timeZoneId;
                    document.getElementById('tomorrow-timezone').textContent = data.timeZoneId;
                } else {
                    console.error('Time Zone API error:', data.status);
                }
            })
            .catch(error => console.error('Error fetching time zone data:', error));
    }

    function displaySunData(data, day) {
        // Update HTML elements with data for 'today' or 'tomorrow'
        document.getElementById(`${day}-sunrise`).textContent = formatTime(data.sunrise);
        document.getElementById(`${day}-sunset`).textContent = formatTime(data.sunset);
        
        // Update additional elements
        document.getElementById(`${day}-dawn`).textContent = formatTime(data.civil_twilight_begin);
        document.getElementById(`${day}-dusk`).textContent = formatTime(data.civil_twilight_end);
        document.getElementById(`${day}-daylength`).textContent = formatDayLength(data.day_length);
        document.getElementById(`${day}-solarnoon`).textContent = formatTime(data.solar_noon);
    }

    function formatDayLength(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    function formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function displayError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                displayError("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                displayError("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                displayError("The request to get user location timed out.");
                break;
            default:
                displayError("An unknown error occurred.");
                break;
        }
    }

    function formatTime(timeString) {
        const utcDate = new Date(timeString);
        const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
        return localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
});
