const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
	const sendButton0 = document.getElementById("sendButton0");

	sendButton0.addEventListener("click", () => {
		const selectedChannelId = document.getElementById("discordChannel0").value;
		const msg = document.getElementById("msgToChannel").value;

		// Check if the user has selected a channel
		if (!selectedChannelId) {
			alert("Please select a Discord channel.");
			return;
		}
		document.getElementById("discordChannel0").value = "";

		// Check if the text format is not empty
		if (!msg.trim()) {
			alert("Please enter a text.");
			return;
		}
		document.getElementById("msgToChannel").value = "";

		// Send selected channel ID and text format to the main process
		ipcRenderer.send("sendData0", { selectedChannelId, msg });
	});

	ipcRenderer.on("guildBotIsIn", (event, guilds) => {
		const guildServerDropdown = document.getElementById("discordServer");

		// Populate dropdown with servers
		guilds.forEach((guildServers) => {
			const serverOption = document.createElement("option");
			serverOption.value = guildServers.id;
			serverOption.textContent = guildServers.name;
			guildServerDropdown.appendChild(serverOption);
		});
	});

	// Listen for channelsData message from main process
	ipcRenderer.on("textChannelsData", (event, channels0) => {
		//console.log("Received channels:", channels); // Debug: Log received channels

		const channelDropdown0 = document.getElementById("discordChannel0");

		// Populate dropdown for discordChannel0
		channels0.forEach((channel0) => {
			//console.log("Adding channel:", channel); // Debug: Log each channel being added
			const option0 = document.createElement("option");
			option0.value = channel0.id;
			option0.textContent = channel0.name;
			channelDropdown0.appendChild(option0);
		});
	});

	ipcRenderer.on("textChannelsData", (event, channels1) => {
		//console.log("Received channels:", channels); // Debug: Log received channels

		const channelDropdown1 = document.getElementById("discordChannel1");

		// Populate dropdown for discordChannel1
		channels1.forEach((channel1) => {
			//console.log("Adding channel:", channel); // Debug: Log each channel being added
			const option1 = document.createElement("option");
			option1.value = channel1.id;
			option1.textContent = channel1.name;
			channelDropdown1.appendChild(option1);
		});
	});

	ipcRenderer.on("test-message", (event, message) => {
		console.log("Received message from main process:", message);
	});

	discordServer.addEventListener("change", () => {
		const serverValue = discordServer.value;
		console.log(serverValue); // Just for debugging
		clearChannelDropdowns();
		ipcRenderer.send("guildIdValue", { guildId: serverValue });
	});
});

let previousConnectionStatus = null;

// Listen for 'checkInternetStatus' message from main process
ipcRenderer.on("checkInternetStatus", (event, connection) => {
	// Only log if the connection status has changed
	if (connection !== previousConnectionStatus) {
		// Function to update status indicator based on connection status
		function updateStatusIndicator(connection) {
			const indicator = document.getElementById("indicator");
			const statusText = document.getElementById("statusText");

			if (connection) {
				indicator.classList.remove("red");
				indicator.classList.add("green");
				statusText.textContent = "Status: Connected";
				console.log("Status: Connected");
			} else {
				indicator.classList.remove("green");
				indicator.classList.add("red");
				statusText.textContent = "Status: Not Connected";
				console.log("Status: Not Connected");
			}
		}

		// Update the status indicator based on the connection status
		updateStatusIndicator(connection);

		// Update the previous connection status
		previousConnectionStatus = connection;
	}
});

function clearChannelDropdowns() {
	// Clear the options of the channel dropdown boxes
	const channelDropdowns = document.querySelectorAll(
		'select[id^="discordChannel"]'
	);
	channelDropdowns.forEach((dropdown) => {
		dropdown.innerHTML = '<option value="" disabled selected>-</option>';
	});
}
