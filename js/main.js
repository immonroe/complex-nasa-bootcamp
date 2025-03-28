const button = document.querySelector('button')
const url = 'https://api.nasa.gov/planetary/apod?api_key=NXAAGwyfeIROseR1cQLlLqNzaMag8fYRk6eYt89P'

button.addEventListener('click', () => {
    let search = document.querySelector('input').value

    // fetch(url + `&date=${search}`)
    fetch('https://data.nasa.gov/resource/gvk9-iz74.json')
    .then(res => res.json()) // parse response as JSON
    .then(data => {
        // console.log(data)

        for (i=0; i < data.length; i++) {
            const listCenter = document.createElement('h3')
            const listCity = document.createElement('p')
            const listState = document.createElement('p')
            const listCountry= document.createElement('p')
            const listLatLong= document.createElement('p')

            listCenter.textContent = data[i].center
            listCity.textContent = `City: ${data[i].city}`
            listState.textContent = `State: ${data[i].state}`
            listCountry.textContent = `Country: ${data[i].country}`
            listLatLong.textContent = `Latitude/Longitude: ${data[i].location.latitude},${data[i].location.longitude}`

            document.querySelector('.results').appendChild(listCenter)
            document.querySelector('.results').appendChild(listCity)
            document.querySelector('.results').appendChild(listState)
            document.querySelector('.results').appendChild(listCountry)
            document.querySelector('.results').appendChild(listLatLong)

            // Call function to get location + weather of facility
        }
    })
    .catch(err => {
        console.log(`error ${err}`)
    })
})

// const buttonTwo = document.querySelector('button')
// // document.querySelector('.results').style.display = 'none'
// button.addEventListener('click', () => {
//     let search = document.querySelector('input').value
//     const url = `https://api.weatherapi.com/v1/current.json?key=4c455336721b4765a08175859252603&q=${search}&days=1&aqi=yes&alerts=no`

//     fetch(url) //Make sure to include to search for date
//     .then(loc => loc.json()) // parse response as JSON
//     .then(data => {
//         console.log(loc)
//         // document.querySelector('.results').style.display = 'block'
//         // document.querySelector('.cityState').innerHTML = `${loc.location.name}, ${loc.location.region}`
//         // document.querySelector('.country').innerHTML = loc.location.country
//         // document.querySelector('.describe').innerHTML = loc.current.condition.text
//         // document.querySelector('.temp').innerHTML = `${loc.current.temp_f}\u00B0F`
//         // document.querySelector('img').src = `https:${loc.current.condition.icon}`
//     })
//     .catch(err => {
//         console.log(`error ${err}`)
//     })
// })