// Tworzenie mapy z satelitarną warstwą ESRI
var map = L.map('map').setView([54.35447938106172, 18.593549377990467], 15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
}).addTo(map);

// Tworzenie niestandardowej ikony drona
var droneIcon = L.icon({
    iconUrl: '../images/drone-icon.png',  // Ścieżka do ikony drona
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

// Pozycja początkowa i parametry animacji
var startLatLng = [54.35447938106172, 18.593549377990467];
var currentLatLng = [...startLatLng];
var sideLength = 0.01; // Długość boku kwadratu (ok. 1 km)
var step = 0.0001;
var direction = 'north';
var isPaused = false;
var stepsCounter = 0; // Licznik kroków do pauzy

// Dodanie markera drona z niestandardową ikoną
var droneMarker = L.marker(startLatLng, { icon: droneIcon }).addTo(map)
    .bindPopup('Dron 1');

// Dodanie okręgu reprezentującego obszar obserwacji drona (np. zasięg 500 metrów)
var droneRange = L.circle(startLatLng, {
    radius: 300,
    color: 'blue',
    fillColor: '#30a3ec',
    fillOpacity: 0.3
}).addTo(map);

// Heatmapa
var heatData = [];
var heatLayer = L.heatLayer(heatData, { radius: 25 }).addTo(map);

// Flaga do określenia, czy mapa ma śledzić drona
var followDrone = false;

// Funkcja do aktualizacji pozycji drona
function updateDronePosition() {
    if (isPaused) {
        return;
    }

    // Zaktualizuj współrzędne w zależności od aktualnego kierunku ruchu
    if (direction === 'north') {
        currentLatLng[0] += step;
        if (currentLatLng[0] >= startLatLng[0] + sideLength) {
            direction = 'east';
        }
    } else if (direction === 'east') {
        currentLatLng[1] += step;
        if (currentLatLng[1] >= startLatLng[1] + sideLength) {
            direction = 'south';
        }
    } else if (direction === 'south') {
        currentLatLng[0] -= step;
        if (currentLatLng[0] <= startLatLng[0]) {
            direction = 'west';
        }
    } else if (direction === 'west') {
        currentLatLng[1] -= step;
        if (currentLatLng[1] <= startLatLng[1]) {
            direction = 'north';
        }
    }

    // Zaktualizuj pozycję znacznika drona
    droneMarker.setLatLng(currentLatLng);

    // Zaktualizuj pozycję okręgu widoczności drona
    droneRange.setLatLng(currentLatLng);

    // Jeśli flaga `followDrone` jest włączona, ustaw widok mapy na aktualną pozycję drona
    if (followDrone) {
        map.setView(currentLatLng);
    }

    // Ustal pauzę co określoną liczbę kroków
    stepsCounter++;
    if (stepsCounter >= 30) { // Pauza co 30 kroków
        pauseDrone();
        stepsCounter = 0;
    } else {
        // Ustaw czas następnej aktualizacji
        setTimeout(updateDronePosition, 100);
    }
}

// Funkcja do pauzowania drona i skanowania obszaru
function pauseDrone() {
    isPaused = true;

    // Dodaj punkt w miejscu, w którym dron się zatrzymuje
    L.circleMarker(currentLatLng, {
        radius: 3,
        color: 'red',
        fillColor: 'red',
        fillOpacity: 1.0
    }).addTo(map);

    // Symulacja skanowania obszaru i dodanie danych do heatmapy
    scanArea();

    setTimeout(function () {
        isPaused = false;
        updateDronePosition();
    }, 2000); // Pauza trwa 2 sekundy
}

// Funkcja symulująca skanowanie obszaru
function scanArea() {
    for (var i = 0; i < 10; i++) {
        // Generowanie losowych punktów zanieczyszczenia w zasięgu
        var offsetLat = (Math.random() - 0.5) * 0.005;
        var offsetLng = (Math.random() - 0.5) * 0.005;
        var intensity = Math.random() * 2; // Losowa intensywność zanieczyszczenia

        heatData.push([currentLatLng[0] + offsetLat, currentLatLng[1] + offsetLng, intensity]);
    }

    // Aktualizacja warstwy heatmapy
    heatLayer.setLatLngs(heatData);
}

// Rozpocznij ruch drona
updateDronePosition();

// Obsługa kliknięcia na drona
droneMarker.on('click', function() {
    // Przełącz stan flagi `followDrone`
    followDrone = !followDrone;

    // Otwórz dymek (popup) dla markera
    droneMarker.openPopup();
});
