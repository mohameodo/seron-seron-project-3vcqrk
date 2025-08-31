document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://de1.api.radio-browser.info/json';

    const topStationsGrid = document.getElementById('top-stations-grid');
    const countriesGrid = document.getElementById('countries-grid');
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('search-results');
    const searchResultsGrid = document.getElementById('search-results-grid');
    const preloader = document.getElementById('preloader');
    const favoritesGrid = document.getElementById('favorites-grid');
    const noFavoritesMessage = document.getElementById('no-favorites-message');

    let favorites = JSON.parse(localStorage.getItem('favoriteStations')) || [];

    const showLoader = () => preloader.style.display = 'flex';
    const hideLoader = () => preloader.style.display = 'none';

    const fetchWithFallback = async (urls) => {
        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.warn(`Failed to fetch from ${url}. Trying next fallback...`);
            }
        }
        throw new Error('All API endpoints failed.');
    };

    const createStationCard = (station) => {
        const isFavorite = favorites.some(fav => fav.stationuuid === station.stationuuid);
        const card = document.createElement('div');
        card.className = 'station-card bg-white p-4 rounded-lg shadow-md cursor-pointer';
        card.innerHTML = `
            <div class="relative">
                 <img src="${station.favicon || 'https://via.placeholder.com/100'}" alt="${station.name}" class="w-full h-32 object-cover rounded-md mb-3" onerror="this.src='https://via.placeholder.com/100'">
                 <button data-station-id="${station.stationuuid}" class="favorite-btn absolute top-2 right-2 bg-white/70 rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart text-red-500"></i>
                 </button>
            </div>
            <h3 class="font-semibold truncate">${station.name}</h3>
            <p class="text-sm text-gray-500 truncate">${station.country}</p>
        `;
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                window.location.href = `player.html?stationuuid=${station.stationuuid}`;
            }
        });
        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(station, card);
        });
        return card;
    };

    const renderStations = (stations, gridElement) => {
        gridElement.innerHTML = '';
        stations.forEach(station => {
            gridElement.appendChild(createStationCard(station));
        });
    };

    const toggleFavorite = (station, cardElement) => {
        const index = favorites.findIndex(fav => fav.stationuuid === station.stationuuid);
        const heartIcon = cardElement.querySelector('.favorite-btn i');
        if (index > -1) {
            favorites.splice(index, 1);
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
        } else {
            favorites.push(station);
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
        }
        localStorage.setItem('favoriteStations', JSON.stringify(favorites));
        renderFavorites();
    };

    const renderFavorites = () => {
        if (favorites.length > 0) {
            renderStations(favorites, favoritesGrid);
            noFavoritesMessage.classList.add('hidden');
            favoritesGrid.classList.remove('hidden');
        } else {
            favoritesGrid.classList.add('hidden');
            noFavoritesMessage.classList.remove('hidden');
        }
    };

    const fetchTopStations = async () => {
        try {
            const stations = await fetchWithFallback([`${API_BASE_URL}/stations/topclick/20`]);
            renderStations(stations, topStationsGrid);
        } catch (error) {
            console.error('Error fetching top stations:', error);
            topStationsGrid.innerHTML = `<p class="text-red-500 col-span-full">Could not load top stations.</p>`;
        }
    };

    const fetchCountries = async () => {
        try {
            const countries = await fetchWithFallback([`${API_BASE_URL}/countries`]);
            countriesGrid.innerHTML = '';
            countries.slice(0, 18).forEach(country => {
                const countryCard = document.createElement('div');
                countryCard.className = 'country-card bg-gray-100 p-4 rounded-lg text-center font-semibold text-gray-700 cursor-pointer';
                countryCard.textContent = country.name;
                countryCard.addEventListener('click', () => {
                    searchInput.value = country.name;
                    performSearch(country.name);
                    window.scrollTo(0, 0);
                });
                countriesGrid.appendChild(countryCard);
            });
        } catch (error) {
            console.error('Error fetching countries:', error);
            countriesGrid.innerHTML = `<p class="text-red-500 col-span-full">Could not load countries.</p>`;
        }
    };

    const performSearch = async (query) => {
        if (query.length < 2) {
            searchResultsContainer.classList.add('hidden');
            return;
        }
        showLoader();
        try {
            const stations = await fetchWithFallback([`${API_BASE_URL}/stations/search?name=${query}&limit=50`]);
            renderStations(stations, searchResultsGrid);
            searchResultsContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error performing search:', error);
            searchResultsGrid.innerHTML = `<p class="text-red-500 col-span-full">Search failed. Please try again.</p>`;
        } finally {
            hideLoader();
        }
    };

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(searchInput.value.trim());
        }, 300);
    });

    const init = async () => {
        showLoader();
        await Promise.all([fetchTopStations(), fetchCountries()]);
        renderFavorites();
        hideLoader();
    };

    init();
});