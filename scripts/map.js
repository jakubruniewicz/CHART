// Startowa pozycja pierwszego drona
var startLatLng = [54.35447938106172, 18.593549377990467];

// Parametry trajektorii
var step = 0.0001; // Wielkość jednego kroku (stopni współrzędnych)
var directions = ['north', 'east', 'south', 'west']; // Kolejne kierunki lotu
var stepsPerSegment = 100; // Liczba kroków w jednym kierunku
var totalStepsLimit = 150; // Limit kroków dla każdego drona

// Flaga kontrolująca generowanie punktów heatmapy
var isGeneratingHeatmap = true;

// Tworzenie mapy
var map = L.map('map').setView(startLatLng, 15);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
}).addTo(map);

// Tworzenie ikon dla dronów
var droneIcon = L.icon({
    iconUrl: '../images/drone-icon.png', // Ikona drona
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

// Tworzenie tablicy dronów
var drones = [
    {
        id: 1,
        currentLatLng: [...startLatLng],
        directionIndex: 0,
        currentStep: 0,
        totalSteps: 0,
        marker: L.marker(startLatLng, { icon: droneIcon }).addTo(map).bindPopup('Dron 1'),
        range: L.circle(startLatLng, { radius: 200, color: 'blue', fillColor: '#30a3ec', fillOpacity: 0.3 }).addTo(map)
    },
    {
        id: 2,
        currentLatLng: [startLatLng[0] + 0.0035, startLatLng[1] + 0.001],
        directionIndex: 0,
        currentStep: 0,
        totalSteps: 0,
        marker: L.marker([startLatLng[0] + 0.001, startLatLng[1] + 0.001], { icon: droneIcon }).addTo(map).bindPopup('Dron 2'),
        range: L.circle([startLatLng[0] + 0.001, startLatLng[1] + 0.001], { radius: 200, color: 'green', fillColor: '#30a3ec', fillOpacity: 0.3 }).addTo(map)
    },
    {
        id: 3,
        currentLatLng: [startLatLng[0] - 0.0035, startLatLng[1] - 0.001],
        directionIndex: 0,
        currentStep: 0,
        totalSteps: 0,
        marker: L.marker([startLatLng[0] - 0.001, startLatLng[1] - 0.001], { icon: droneIcon }).addTo(map).bindPopup('Dron 3'),
        range: L.circle([startLatLng[0] - 0.001, startLatLng[1] - 0.001], { radius: 200, color: 'red', fillColor: '#30a3ec', fillOpacity: 0.3 }).addTo(map)
    }
];

// Heatmapa
var heatData = [];
var heatLayer = L.heatLayer(heatData, { radius: 15 }).addTo(map);

// Funkcja aktualizacji pozycji dronów
function updateDronesPosition() {
    drones.forEach(drone => {
        // Sprawdź, czy dron wykonał 300 kroków
        if (drone.totalSteps >= totalStepsLimit) {
            map.removeLayer(drone.marker); // Usuń marker drona z mapy
            map.removeLayer(drone.range);  // Usuń okrąg widoczności
            console.log(`Dron ${drone.id} zniknął po ${totalStepsLimit} krokach.`);
            return;
        }

        // Aktualizacja pozycji drona
        if (directions[drone.directionIndex] === 'north') {
            drone.currentLatLng[0] += step;
        } else if (directions[drone.directionIndex] === 'east') {
            drone.currentLatLng[1] += step;
        } else if (directions[drone.directionIndex] === 'south') {
            drone.currentLatLng[0] -= step;
        } else if (directions[drone.directionIndex] === 'west') {
            drone.currentLatLng[1] -= step;
        }

        // Aktualizuj marker i okrąg widoczności
        drone.marker.setLatLng(drone.currentLatLng);
        drone.range.setLatLng(drone.currentLatLng);

        // Generuj punkty do heatmapy
        if (isGeneratingHeatmap) {
            scanArea(drone.currentLatLng);
        }

        // Aktualizuj licznik kroków
        drone.currentStep++;
        drone.totalSteps++;
        if (drone.currentStep >= stepsPerSegment) {
            drone.currentStep = 0;
            drone.directionIndex = (drone.directionIndex + 1) % directions.length;
        }
    });

    // Wywołaj ponownie po krótkiej pauzie
    setTimeout(updateDronesPosition, 200); // 200 ms opóźnienia
}

// Funkcja symulująca skanowanie obszaru
function scanArea(currentLatLng) {
    var detectionRadius = 0.002; // Promień skanowania (300 m)
    var isContaminated = Math.random() < 0.01; // 1% szansa na powstanie skażonego obszaru
    var pointsCount = isContaminated ? 5 : 3; // Jeśli obszar jest skażony, generuj więcej punktów
    var intensityMultiplier = isContaminated ? 1 : 1; // Wyższa intensywność dla skażonych obszarów

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
        if (intensity > 4) {
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
setTimeout(updateDronesPosition, 200);
