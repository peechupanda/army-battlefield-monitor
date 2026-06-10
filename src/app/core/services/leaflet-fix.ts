import * as L from 'leaflet';

export function fixLeafletIcons(): void {
  // Angular + Leaflet: fix broken default marker icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
    iconUrl:       'assets/leaflet/marker-icon.png',
    shadowUrl:     'assets/leaflet/marker-shadow.png',
  });
}
