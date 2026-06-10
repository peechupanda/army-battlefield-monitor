import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Troop, SectorName } from '../models/troop.model';
import { Enemy } from '../models/alert.model';

export const STATUS_COLORS: Record<string, string> = {
  active:  '#3fb950',
  injured: '#f85149',
  reserve: '#a16207',
  enemy:   '#f03030',
};

export const SECTOR_BOUNDS: Record<SectorName, L.LatLngBoundsExpression> = {
  Alpha:   [[28.64, 77.18], [28.70, 77.23]],
  Bravo:   [[28.64, 77.23], [28.70, 77.28]],
  Charlie: [[28.58, 77.18], [28.64, 77.23]],
  Delta:   [[28.58, 77.23], [28.64, 77.28]],
};

export const SECTOR_COLORS: Record<SectorName, string> = {
  Alpha:   '#00c85020', Bravo:   '#ff3c3c20',
  Charlie: '#3c64ff20', Delta:   '#ffa00020',
};

@Injectable({ providedIn: 'root' })
export class MapService {
  private map!: L.Map;
  private troopLayer = L.layerGroup();
  private enemyLayer = L.layerGroup();
  private sectorLayer = L.layerGroup();
  private selectedSector: SectorName | null = null;

  onSectorClick?: (sector: SectorName) => void;

  init(elementId: string): void {
    this.map = L.map(elementId, {
      center: [28.64, 77.23],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark military-style tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(this.map);

    this.sectorLayer.addTo(this.map);
    this.troopLayer.addTo(this.map);
    this.enemyLayer.addTo(this.map);

    this.drawSectors();
  }

  private drawSectors(): void {
    this.sectorLayer.clearLayers();
    const sectors = Object.keys(SECTOR_BOUNDS) as SectorName[];
    sectors.forEach(sector => {
      const rect = L.rectangle(SECTOR_BOUNDS[sector] as L.LatLngBoundsLiteral, {
        color: SECTOR_COLORS[sector].replace('20', 'aa'),
        weight: 1.5,
        fillColor: SECTOR_COLORS[sector],
        fillOpacity: this.selectedSector === sector ? 0.3 : 0.12,
        dashArray: '6,6',
      }).addTo(this.sectorLayer);

      // Sector label
      const bounds = L.latLngBounds(SECTOR_BOUNDS[sector] as L.LatLngBoundsLiteral);
      const center = bounds.getCenter();
      L.marker(center, {
        icon: L.divIcon({
          className: '',
          html: `<div style="color:${SECTOR_COLORS[sector].replace('20','ee')};font-family:monospace;font-weight:bold;font-size:12px;letter-spacing:2px;text-shadow:0 0 6px #000;white-space:nowrap">SEC-${sector.toUpperCase()}</div>`,
          iconAnchor: [28, 8],
        }),
      }).addTo(this.sectorLayer);

      rect.on('click', () => {
        this.selectedSector = this.selectedSector === sector ? null : sector;
        this.drawSectors();
        this.onSectorClick?.(sector);
      });
    });
  }

  updateTroops(troops: Troop[]): void {
    this.troopLayer.clearLayers();
    troops.forEach(troop => {
      const color = STATUS_COLORS[troop.status];
      const marker = L.circleMarker([troop.latitude, troop.longitude], {
        radius: 6,
        color: '#ffffff44',
        weight: 1,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(this.troopLayer);

      marker.bindPopup(`
        <div style="font-family:monospace;font-size:12px;background:#161b22;color:#c9d1d9;border-radius:6px;padding:8px;min-width:160px">
          <div style="font-weight:bold;color:#58a6ff;margin-bottom:4px">${troop.id} — ${troop.name}</div>
          <div style="color:#8b949e">Rank: <span style="color:#c9d1d9">${troop.rank}</span></div>
          <div style="color:#8b949e">Unit: <span style="color:#c9d1d9">${troop.unit}</span></div>
          <div style="color:#8b949e">Status: <span style="color:${color}">${troop.status.toUpperCase()}</span></div>
          <div style="color:#8b949e">Sector: <span style="color:#d29922">${troop.sector}</span></div>
        </div>
      `, { className: 'military-popup' });
    });
  }

  updateEnemies(enemies: Enemy[]): void {
    this.enemyLayer.clearLayers();
    enemies.forEach(enemy => {
      // Enemy influence zone
      L.circle([enemy.latitude, enemy.longitude], {
        radius: enemy.strength * 30,
        color: '#f0303033',
        weight: 0.5,
        fillColor: '#f0303011',
        fillOpacity: 1,
      }).addTo(this.enemyLayer);

      // Enemy triangle marker
      const marker = L.marker([enemy.latitude, enemy.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div style="color:#f03030;font-size:16px;text-shadow:0 0 8px #f03030aa">▲</div>`,
          iconAnchor: [8, 14],
        }),
      }).addTo(this.enemyLayer);

      marker.bindPopup(`
        <div style="font-family:monospace;font-size:12px;background:#1a0a0a;color:#c9d1d9;border-radius:6px;padding:8px">
          <div style="color:#f85149;font-weight:bold">ENEMY CONTACT ${enemy.id}</div>
          <div style="color:#8b949e">Strength: <span style="color:#f85149">${enemy.strength}</span></div>
          <div style="color:#8b949e">Type: <span style="color:#c9d1d9">${enemy.type ?? 'Unknown'}</span></div>
          <div style="color:#8b949e">Confirmed: <span style="color:${enemy.confirmed ? '#3fb950' : '#d29922'}">${enemy.confirmed ? 'YES' : 'UNCONFIRMED'}</span></div>
        </div>
      `, { className: 'military-popup' });
    });
  }

  selectSector(sector: SectorName | null): void {
    this.selectedSector = sector;
    this.drawSectors();
    if (sector) {
      const bounds = L.latLngBounds(SECTOR_BOUNDS[sector] as L.LatLngBoundsLiteral);
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }
  }

  toggle3D(enabled: boolean): void {
    // CSS 3D perspective tilt on the map container
    const el = this.map.getContainer();
    el.style.transition = 'transform 0.5s ease';
    el.style.transformOrigin = 'center 65%';
    el.style.transform = enabled
      ? 'perspective(700px) rotateX(40deg) scale(1.15)'
      : '';
  }

  invalidate(): void {
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  destroy(): void {
    this.map?.remove();
  }
}
