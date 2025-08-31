document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://de1.api.radio-browser.info/json';

    const stationNameEl = document.getElementById('station-name');
    const stationCountryEl = document.getElementById('station-country');
    const stationFaviconEl = document.getElementById('station-favicon');
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');
    const playerCard = document.getElementById('player-card');

    const getStationUUID = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('stationuuid');
    };

    const fetchStationDetails = async (uuid) => {
        try {
            const response = await fetch(`${API_BASE_URL}/stations/byuuid?uuids=${uuid}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data && data.length > 0) {
                return data[0];
            } else {
                throw new Error('Station not found');
            }
        } catch (error) {
            console.error('Failed to fetch station details:', error);
            displayError('Could not load station details.');
        }
    };

    const updateUI = (station) => {
        stationNameEl.textContent = station.name;
        stationCountryEl.textContent = `${station.state ? station.state + ', ' : ''}${station.country}`;
        stationFaviconEl.src = station.favicon || 'https://via.placeholder.com/150';
        stationFaviconEl.onerror = () => { stationFaviconEl.src = 'https://via.placeholder.com/150'; };
        document.title = `${station.name} - TuneIn World`;
        audioPlayer.src = station.url_resolved;

        // Animate the card into view
        setTimeout(() => {
             playerCard.classList.remove('scale-95', 'opacity-0');
        }, 100);
    };

    const displayError = (message) => {
        stationNameEl.textContent = 'Error';
        stationCountryEl.textContent = message;
        errorMessage.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');
    };

    const togglePlayPause = () => {
        if (audioPlayer.paused) {
            audioPlayer.play().catch(e => {
                console.error('Playback failed:', e);
                errorMessage.classList.remove('hidden');
                loadingIndicator.classList.add('hidden');
            });
        } else {
            audioPlayer.pause();
        }
    };

    playPauseBtn.addEventListener('click', togglePlayPause);

    audioPlayer.addEventListener('play', () => {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.add('hidden');
    });

    audioPlayer.addEventListener('pause', () => {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    });

    audioPlayer.addEventListener('playing', () => {
        loadingIndicator.classList.add('hidden');
    });

    audioPlayer.addEventListener('waiting', () => {
        loadingIndicator.classList.remove('hidden');
    });

    audioPlayer.addEventListener('error', () => {
        errorMessage.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    });

    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value;
    });

    const init = async () => {
        const stationUUID = getStationUUID();
        if (stationUUID) {
            const station = await fetchStationDetails(stationUUID);
            if (station) {
                updateUI(station);
            }
        } else {
            displayError('No station selected.');
        }
    };

    init();
});