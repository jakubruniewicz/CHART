// Startowa pozycja drona
var startLatLng = [54.35447938106172, 18.593549377990467];
var currentLatLng = [...startLatLng]; // Kopia startowej pozycji

// Parametry trajektorii
var step = 0.0001; // Wielkość jednego kroku (stopni współrzędnych)
var directions = ['north', 'east', 'south', 'east']; // Kolejne kierunki lotu
var directionIndex = 0; // Indeks bieżącego kierunku
var stepsPerSegment = 50; // Liczba kroków w jednym kierunku
var currentStep = 0; // Licznik kroków w bieżącym segmencie

// Flaga kontrolująca generowanie punktów heatmapy
var isGeneratingHeatmap = true;

// Tworzenie mapy
var map = L.map('map').setView(startLatLng, 15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
}).addTo(map);

// Tworzenie markera drona
var droneIcon = L.icon({
    iconUrl: '../images/drone-icon.png', // Ikona drona
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});
var droneMarker = L.marker(startLatLng, { icon: droneIcon }).addTo(map)
    .bindPopup('Dron');

// Okrąg widoczności drona
var droneRange = L.circle(startLatLng, {
    radius: 200,
    color: 'blue',
    fillColor: '#30a3ec',
    fillOpacity: 0.3
}).addTo(map);

// Heatmapa
var heatData = [];
var heatLayer = L.heatLayer(heatData, { radius: 15 }).addTo(map);

// Funkcja aktualizacji pozycji drona
function updateDronePosition() {
    // Aktualizacja bieżącej pozycji w oparciu o kierunek
    if (directions[directionIndex] === 'north') {
        currentLatLng[0] += step; // Ruch na północ (zwiększ szerokość geograficzną)
    } else if (directions[directionIndex] === 'east') {
        currentLatLng[1] += step; // Ruch na wschód (zwiększ długość geograficzną)
    } else if (directions[directionIndex] === 'south') {
        currentLatLng[0] -= step; // Ruch na południe (zmniejsz szerokość geograficzną)
    } else if (directions[directionIndex] === 'west') {
        currentLatLng[1] -= step; // Ruch na zachód (zmniejsz długość geograficzną)
    }

    // Aktualizuj pozycję markera i okręgu drona
    droneMarker.setLatLng(currentLatLng);
    droneRange.setLatLng(currentLatLng);

    // Generuj punkty do heatmapy tylko, jeśli `isGeneratingHeatmap` jest true
    if (isGeneratingHeatmap) {
        scanArea(currentLatLng);
    }

    // Aktualizuj licznik kroków
    currentStep++;
    if (currentStep >= stepsPerSegment) {
        currentStep = 0; // Zresetuj licznik kroków
        directionIndex = (directionIndex + 1) % directions.length; // Przejdź do następnego kierunku
    }

    // Wywołaj ponownie po krótkiej pauzie
    setTimeout(updateDronePosition, 200); // Pauza 200 ms na krok
}

// Funkcja cyklicznie włączająca i wyłączająca generowanie heatmapy
function toggleHeatmapGeneration() {
    isGeneratingHeatmap = !isGeneratingHeatmap; // Zmień stan generowania heatmapy
    setTimeout(toggleHeatmapGeneration, isGeneratingHeatmap ? 5000 : 3000); // 5 sekund aktywności, 3 sekundy przerwy
}

// Funkcja symulująca skanowanie obszaru
function scanArea(currentLatLng) {
    var detectionRadius = 0.002; // Promień skanowania (300 m)
    var isContaminated = Math.random() < 0.01; // 1% szansa na powstanie skażonego obszaru
    var pointsCount = isContaminated ? 25 : 5; // Jeśli obszar jest skażony, generuj więcej punktów
    var intensityMultiplier = isContaminated ? 5 : 2; // Wyższa intensywność dla skażonych obszarów

    for (var i = 0; i < pointsCount; i++) {
        var angle = Math.random() * 2 * Math.PI; // Kąt losowy
        var distance = Math.random() * detectionRadius; // Odległość w granicach promienia
        var offsetLat = Math.sin(angle) * distance;
        var offsetLng = Math.cos(angle) * distance;

        // Losowa intensywność zanieczyszczenia
        var intensity = Math.random() * intensityMultiplier;

        // Dodanie punktu na heatmapę
        var pointLatLng = [
            currentLatLng[0] + offsetLat,
            currentLatLng[1] + offsetLng
        ];

        heatData.push([...pointLatLng, intensity]);

        // Dodaj marker, jeśli intensywność przekracza próg
        if (intensity > 4.5) { // Próg dużego natężenia
            addHighIntensityMarker(pointLatLng, intensity);
        }
    }

    // Aktualizacja heatmapy
    heatLayer.setLatLngs(heatData);
}

// Funkcja dodająca marker dla dużej intensywności
function addHighIntensityMarker(latlng, intensity) {
    L.circleMarker(latlng, {
        radius: 8,
        color: 'red',
        fillColor: 'orange',
        fillOpacity: 0.9
    }).addTo(map).bindPopup(`Wysoka intensywność: ${intensity.toFixed(2)}`);
}

// Rozpocznij cykliczne zarządzanie heatmapą
toggleHeatmapGeneration();

// Rozpocznij ruch drona
updateDronePosition();

// Obsługa kliknięcia na drona
droneMarker.on('click', function() {
    map.setView(droneMarker.getLatLng());
});
