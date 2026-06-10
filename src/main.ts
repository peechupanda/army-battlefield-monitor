import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { fixLeafletIcons } from './app/core/services/leaflet-fix';

fixLeafletIcons();

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
