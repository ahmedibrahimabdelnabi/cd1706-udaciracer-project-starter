// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	track_name: undefined,
	player_id: undefined,
	player_name: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	console.log("Getting form info for dropdowns!")
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
			store.track_id = target.id
			store.track_name = target.innerHTML
		}

		// Racer form field
		if (target.matches('.card.racer')) {
			handleSelectRacer(target)
			store.player_id = target.id
			store.player_name = target.innerHTML
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
	
			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate()
		}

		console.log("Store updated :: ", store)
	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// BELOW THIS LINE IS CODE WHERE STUDENT EDITS ARE NEEDED ----------------------------
// TIP: Do a full file search for TODO to find everything that needs to be done for the game to work

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	console.log("in create race");

	try {
		// TODO - Get player_id and track_id from the store
		const { player_id, track_id } = store;

		if (!player_id || !track_id) {
			alert("Please select a racer and a track before starting the race!");
			return;
		}

		// TODO - Call the asynchronous method createRace, passing the correct parameters
		const race = await createRace(player_id, track_id);

		// TODO - Update the store with the race id in the response
		store.race_id = race.ID; // API response returns race ID as `ID`

		console.log("Race created with ID:", store.race_id);

		// Render race start view
		renderAt('#race', renderRaceStartView(store.track_name));

		// The race has been created, now start the countdown
		await runCountdown();

		// Start the race
		await startRace(store.race_id);

		// Start polling race data
		await runRace(store.race_id);
	} catch (error) {
		console.error("Error in handleCreateRace:", error);
	}
}

function runRace(raceID) {
	return new Promise((resolve, reject) => {
		const raceInterval = setInterval(async () => {
			try {
				const res = await getRace(raceID);

				if (res.status === "in-progress") {
					// Update the leaderboard
					renderAt('#leaderBoard', raceProgress(res.positions));
				} else if (res.status === "finished") {
					// Stop polling, show final results, and resolve the promise
					clearInterval(raceInterval);
					renderAt('#race', resultsView(res.positions));
					resolve(res);
				}
			} catch (error) {
				console.error("Error fetching race data:", error);
				clearInterval(raceInterval);
				reject(error);
			}
		}, 500);
	});
}


async function runCountdown() {
	try {
		// Wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise(resolve => {
			const countdownInterval = setInterval(() => {
				// Update the countdown display
				document.getElementById('big-numbers').innerHTML = timer;

				// Check if countdown is complete
				if (timer === 0) {
					clearInterval(countdownInterval);
					resolve();
				} else {
					timer--; // Decrement the countdown
				}
			}, 1000); // Runs every 1 second
		});
	} catch (error) {
		console.error("Error in runCountdown:", error);
	}
}


function handleSelectRacer(target) {
	console.log("selected a racer", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')
}

function handleSelectTrack(target) {
	console.log("selected track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')	
}

async function handleAccelerate() {
	console.log("Accelerate button clicked");

	try {
		await accelerate(store.race_id);
		console.log("Acceleration successful!");
	} catch (error) {
		console.error("Error accelerating:", error);
	}
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer
	// OPTIONAL: There is more data given about the race cars than we use in the game, if you want to factor in top speed, acceleration, 
	// and handling to the various vehicles, it is already provided by the API!
	return `<h4 class="card racer" id="${id}">${driver_name}</h3>`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `<h4 id="${id}" class="card track">${name}</h4>`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	userPlayer.driver_name += " (you)"
	let count = 1
  
	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<h3>Race Results</h3>
			<p>The race is done! Here are the final results:</p>
			${results.join('')}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	let userPlayer = positions.find(e => e.id === parseInt(store.player_id))
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<table>
			${results.join('')}
		</table>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

// Fetch all tracks
async function getTracks() {
	console.log(`calling server :: ${SERVER}/api/tracks`);
	try {
		const response = await fetch(`${SERVER}/api/tracks`);
		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
		return await response.json();
	} catch (error) {
		console.error("Error fetching tracks:", error);
	}
}

// Fetch all racers (cars)
async function getRacers() {
	console.log(`calling server :: ${SERVER}/api/cars`);
	try {
		const response = await fetch(`${SERVER}/api/cars`);
		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
		return await response.json();
	} catch (error) {
		console.error("Error fetching racers:", error);
	}
}


function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

async function getRace(id) {
	console.log(`calling server :: ${SERVER}/api/races/${id}`);
	try {
		const response = await fetch(`${SERVER}/api/races/${id}`);
		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
		return await response.json();
	} catch (error) {
		console.error(`Error fetching race ${id}:`, error);
	}
}


function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with getRace request::", err))
}

async function accelerate(id) {
	console.log(`Accelerating race ${id}`);

	try {
		await fetch(`${SERVER}/api/races/${id}/accelerate`, {
			method: 'POST',
			...defaultFetchOpts(),
		});
	} catch (error) {
		console.error(`Error accelerating race ${id}:`, error);
	}
}
