import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild } from '@angular/core';

declare var google: any;

@Component({
  selector: 'app-restaurant-map',
  template: `
    <div class="map-wrapper">
      <div #mapContainer class="map-container"></div>
      <div class="coordinates-display" *ngIf="latitude && longitude">
        Lat: {{latitude | number:'1.6-6'}}, Lng: {{longitude | number:'1.6-6'}}
      </div>
    </div>
  `,
  styles: [`
    .map-wrapper {
      position: relative;
    }
    .map-container {
      width: 100%;
      height: 200px;
      margin: 16px 0;
      border-radius: 8px;
    }
    .coordinates-display {
      position: absolute;
      bottom: 25px;
      left: 10px;
      background: rgba(255, 255, 255, 0.9);
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  `]
})
export class RestaurantMapComponent implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() set latitude(value: number | undefined) {
    this._latitude = value ?? 3.5036344292448143; 
    if (this.map && this.marker) {
      this.updateMarkerPosition();
    }
  }
  get latitude(): number {
    return this._latitude;
  }

  @Input() set longitude(value: number | undefined) {
    this._longitude = value ?? 103.40497589485845; 
    if (this.map && this.marker) {
      this.updateMarkerPosition();
    }
  }
  get longitude(): number {
    return this._longitude;
  }

  @Output() coordinatesSelected = new EventEmitter<{lat: number, lng: number}>();

  private _latitude: number = 3.5036344292448143;
  private _longitude: number = 103.40497589485845;
  private map: any;
  private marker: any;

  ngOnInit() {
    this.initMap();
  }

  private initMap(): void {
    const coordinates = { lat: this._latitude, lng: this._longitude };
    
    const mapOptions = {
      center: coordinates,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    this.marker = new google.maps.Marker({
      position: coordinates,
      map: this.map,
      draggable: true
    });

    this.map.addListener('click', (event: any) => {
      const position = event.latLng;
      this._latitude = position.lat();
      this._longitude = position.lng();
      this.updateMarkerPosition();
      this.emitCoordinates();
    });

    this.marker.addListener('dragend', (event: any) => {
      const position = this.marker.getPosition();
      this._latitude = position.lat();
      this._longitude = position.lng();
      this.emitCoordinates();
    });
  }

  private updateMarkerPosition(): void {
    const position = { lat: this._latitude, lng: this._longitude };
    this.marker.setPosition(position);
    this.map.setCenter(position);
  }

  private emitCoordinates(): void {
    this.coordinatesSelected.emit({
      lat: this._latitude,
      lng: this._longitude
    });
  }

  public updateFromAddress(address: string): Promise<void> {
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK') {
          const location = results[0].geometry.location;
          this._latitude = location.lat();
          this._longitude = location.lng();
          this.updateMarkerPosition();
          this.emitCoordinates();
          resolve();
        } else {
          reject('Geocoding failed: ' + status);
        }
      });
    });
  }
}