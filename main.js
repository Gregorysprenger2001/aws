/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11,
};

// Karte initialisieren
let map = L.map("map").setView([ibk.lat, ibk.lng], ibk.zoom);

// Change default options
L.control.rainviewer({
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map);

// thematische Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    wind: L.featureGroup(),
    snow: L.featureGroup(),
    direction: L.featureGroup().addTo(map),
}

// Layer control
L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`,
        maxZoom: 12,
    }).addTo(map),
    
    "OpenStreetMap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "OpenTopoMap": L.tileLayer.provider("OpenTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Windgeschwindigkeit": overlays.wind,
    "Schneehöhen": overlays.snow,
    "Windrichtungen und Windgeschwindigkeiten": overlays.direction,
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Wetterstationen
async function loadStations(url) {
    let response = await fetch(url);
    let jsondata = await response.json();

    // Wetterstationen mit Icons und Popups
    L.geoJSON(jsondata, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: "icons/wifi.png",
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            });
        },
        // Popup
        onEachFeature: function (feature, layer) {
            let pointInTime = new Date(feature.properties.date);
            //console.log(feature.properties);
            layer.bindPopup(`
                <h4>${feature.properties.name} (${feature.geometry.coordinates[2]}m)</h4>
                <ul>
                    <li>Lufttemperatur (C) ${feature.properties.LT !== undefined ? feature.properties.LT : "-"}</li>
                    <li>Relative Luftfeuchte (%) ${feature.properties.RH || "-"}</li>
                    <li>Windgeschwindigkeit (km/h) ${feature.properties.WG || "-"}</li>
                    <li>Schneehöhe (cm) ${feature.properties.HS || "-"}</li>
                </ul>
                <span>${pointInTime.toLocaleString()}</span>
                `);
        }
    }).addTo(overlays.stations)
    showTemperature(jsondata);
    showWind(jsondata);
    showSnow(jsondata);
    showDirection(jsondata);
}

loadStations("https://static.avalanche.report/weather_stations/stations.geojson");

function showTemperature(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.LT > -50 && feature.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${feature.properties.LT.toFixed(1)}</span>`
                }),
            })
        },
    }).addTo(overlays.temperature);
}

function showWind(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.WG >= 0 && feature.properties.WG < 1000) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${feature.properties.WG.toFixed(1)}km/h</span>`
                }),
            })
        },
    }).addTo(overlays.wind);
}

function showSnow(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.HS > 0 && feature.properties.HS < 2000) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.HS, COLORS.snow);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${feature.properties.HS.toFixed(1)}cm</span>`
                }),
            })
        },
    }).addTo(overlays.snow);
}

function getdegreetoText(degrees) {
    if (degrees >= 337.5 || degrees < 22.5) return "N";
    if (degrees >= 22.5 && degrees < 67.5) return "NO";
    if (degrees >= 67.5 && degrees < 112.5) return "O";
    if (degrees >= 112.5 && degrees < 157.5) return "SO";
    if (degrees >= 157.5 && degrees < 202.5) return "S";
    if (degrees >= 202.5 && degrees < 247.5) return "SW";
    if (degrees >= 247.5 && degrees < 292.5) return "W";
    if (degrees >= 292.5 && degrees < 337.5) return "NW";
    return "-";
}

function showDirection(jsondata) {
    L.geoJSON(jsondata, {
        filter: function (feature) {
            if (feature.properties.WR > 0 && feature.properties.WR < 1000) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            let windrichtung = feature.properties.WR;
            let degreetoText = getdegreetoText(windrichtung);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${degreetoText}</span>`
                }),
            })
        },
    }).addTo(overlays.direction);
}

function getColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}