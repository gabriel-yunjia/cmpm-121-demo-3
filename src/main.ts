import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";
import { Board, Cache } from "./board.ts";

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

  const point = currentMap.getGridCell(
    MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
    MERRILL_CLASSROOM.lng + j * TILE_DEGREES
  );
  const key = `${point.x}_${point.y}`;
  cacheList.set(key, new Cache(point));
  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  pit.bindPopup(() => {
    let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    for (let i = 0; i < value; i++) {
      cacheList.get(key)?.addCoin(point);
    }

    // String maker
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
      const lat = MERRILL_CLASSROOM.lat + i * TILE_DEGREES;
      const lng = MERRILL_CLASSROOM.lng + j * TILE_DEGREES;
      makePit(lat, lng);
    }
  }
}
