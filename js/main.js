const button = document.querySelector('button')
const url = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'

button.addEventListener('click', () => {
    let search = document.querySelector('input').value

    fetch(url + `&date=${search}`) //Make sure to include to search for date
    .then(res => res.json()) // parse response as JSON
    .then(data => {
        // console.log(data.date === search)
        console.log(data)
        document.querySelector('h2').innerText = data.title
        document.querySelector('img').src = data.hdurl
        document.querySelector('h3').innerText = data.explanation

    })
    .catch(err => {
        console.log(`error ${err}`)
    })
})