const button = document.querySelector('button')

// Clear on refresh to update weather with current conditions
document.querySelector('.results').innerHTML = '';

fetch('https://data.nasa.gov/resource/gvk9-iz74.json')
    .then(res => res.json())
    .then(data => {
        // Using higher order function .forEach() vs. standard for loop
        data.forEach(facility => {
            const listCenter = document.createElement('h3')
            const listWeather = document.createElement('p')
            const listCity = document.createElement('p')
            const listState = document.createElement('p')
            const listCountry = document.createElement('p')
            const listLatLong = document.createElement('p')

            listCenter.textContent = facility.center
            listCity.textContent = `City: ${facility.city}`
            listState.textContent = `State: ${facility.state}`
            listCountry.textContent = `Country: ${facility.country}`
            listLatLong.textContent = `Latitude/Longitude: ${facility.location.latitude}, ${facility.location.longitude}`
            listWeather.textContent = ''

            document.querySelector('.results').appendChild(listCenter)
            document.querySelector('.results').appendChild(listCity)
            document.querySelector('.results').appendChild(listState)
            document.querySelector('.results').appendChild(listCountry)
            document.querySelector('.results').appendChild(listLatLong)
            document.querySelector('.results').appendChild(listWeather)

            // basically saying if facility.location.length > 0, aka if a value is present/true
            if (facility.location) {
                // Added parameters to pass into function
                getWeather(facility.location.latitude, facility.location.longitude, listWeather)
            } else {
                listWeather.textContent = 'No weather data available for this location'
            }
        })
    })
    .catch(err => console.log(`Error: ${err}`))

function getWeather(facilityLatitude, facilityLongitude, listWeather) {
    const url = `https://api.weatherapi.com/v1/current.json?key=4c455336721b4765a08175859252603&q=${facilityLatitude},${facilityLongitude}`

    fetch(url)
        .then(res => res.json())
        .then(data => {
            // console.log(data)
            listWeather.textContent = `Weather: ${data.current.temp_f}°F, ${data.current.condition.text}`
            
        })
        .catch(() => {
            listWeather.textContent = 'Weather data unavailable'
        })
}