import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board, Cache, Cell } from "./board.ts";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 15;

class CoordinateConverter {
  static convertToGameCell(lat: number, lng: number): { i: number; j: number } {
    // Use Merrill College as the anchor
    const i = Math.floor((lat - MERRILL_CLASSROOM.lat) / TILE_DEGREES);
    const j = Math.floor((lng - MERRILL_CLASSROOM.lng) / TILE_DEGREES);
    return { i, j };
  }
}

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

const currentMap: Board = new Board();
const cacheList: Map<string, Cache> = new Map<string, Cache>();
const momentos: Map<Cell, string> = new Map<Cell, string>();
const cacheMap: Map<Cell, [leaflet.Layer, boolean]> = new Map<
  Cell,
  [leaflet.Layer, boolean]
>();
const south = document.getElementById("south");
const north = document.getElementById("north");
const east = document.getElementById("east");
const west = document.getElementById("west");

currentMap.getGridCell(MERRILL_CLASSROOM.lat, MERRILL_CLASSROOM.lng);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

function makePit(lat: number, lng: number) {
  const { i, j } = CoordinateConverter.convertToGameCell(lat, lng);
  const bounds = leaflet.latLngBounds([
    [lat, lng],
    [lat + TILE_DEGREES, lng + TILE_DEGREES],
  ]);

  const point = currentMap.getGridCell(lat, lng);

  const key: string = `${point.x}_${point.y}`;
  cacheList.set(key, new Cache(point));
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;
  cacheMap.set(point, [pit, true]);

  const value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
  for (let iter = 0; iter < value; iter++) {
    cacheList.get(key)?.addCoin();
  }
  momentos.set(point, cacheList.get(key)!.toMomento());

  pit.bindPopup(() => {
    const stringAdd: string[] | undefined = cacheList.get(key)?.format();
    let content = `<div>There is a pit here at "${lat.toFixed(4)}:${lng.toFixed(
      4
    )}". It has value <span id="value">${value}</span>.</div>
                  <p>Available Cache:</p>
                  <div id="scrollableContainer" style="max-height: 150px; overflow-y: auto;">`;
    for (let i = 0; i < value; i++) {
      if (stringAdd) {
        content += `<p>${stringAdd[i]}   <button id="collect">collect</button></p>`;
      }
    }
    content += `</div><button id="deposit">deposit</button>`;

    const container = document.createElement("div");
    container.innerHTML = content;

    const collects = container.querySelectorAll<HTMLButtonElement>("#collect")!;
    collects.forEach((collect) => {
      collect.addEventListener("click", () => {
        let value = Number(momentos.get(point));
        if (value > 0) {
          value--;
          points++;
        }
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          value.toString();

        statusPanel.innerHTML = `${points} points accumulated`;
      });
    });
    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      let value = Number(momentos.get(point));
      if (points > 0) {
        value++;
        points--;
      }
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        value.toString();
      statusPanel.innerHTML = `${points} points accumulated`;
    });
    return container;
  });
  pit.addTo(map);
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (Math.random() * 100 <= PIT_SPAWN_PROBABILITY) {
      const lat = playerMarker.getLatLng().lat + i * TILE_DEGREES;
      const lng = playerMarker.getLatLng().lng + j * TILE_DEGREES;
      makePit(lat, lng);
    }
  }
}

function updateMap() {
  console.log("Updating map...");

  const playerCell: Cell = currentMap.getGridCell(
    playerMarker.getLatLng().lat,
    playerMarker.getLatLng().lng
  );

  console.log("Player Cell:", playerCell);

  cacheMap.forEach((cache, cell) => {
    console.log("Cache Cell:", cell);

    const distanceX = Math.abs(cell.x - playerCell.x);
    const distanceY = Math.abs(cell.y - playerCell.y);

    console.log("Distance X:", distanceX);
    console.log("Distance Y:", distanceY);

    const inRangeX = distanceX <= NEIGHBORHOOD_SIZE;
    const inRangeY = distanceY <= NEIGHBORHOOD_SIZE;

    console.log("In Range X:", inRangeX);
    console.log("In Range Y:", inRangeY);

    if (!inRangeX || !inRangeY) {
      if (cache[1]) {
        cache[0].remove();
        cache[1] = false;
      }
    } else {
      if (!cache[1]) {
        cache[0].addTo(map);
        cache[1] = true;
      }
    }
  });

  console.log("Map updated!");
}

south?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat - 0.0001,
    lng: playerMarker.getLatLng().lng,
  });
  updateMap();
});

north?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat + 0.0001,
    lng: playerMarker.getLatLng().lng,
  });
  updateMap();
});

east?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat,
    lng: playerMarker.getLatLng().lng + 0.0001,
  });
  updateMap();
});

west?.addEventListener("click", () => {
  playerMarker.setLatLng({
    lat: playerMarker.getLatLng().lat,
    lng: playerMarker.getLatLng().lng - 0.0001,
  });
  updateMap();
});
