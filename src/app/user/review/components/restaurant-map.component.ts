import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';

declare var google: any;

@Component({
  selector: 'app-restaurant-map',
  template: `
    <div #mapContainer class="map-container"></div>
    <div class="ion-padding">
    <ion-button expand="block" 
                *ngIf="hasValidCoordinates()" 
                (click)="getDirections()"
                color="dark"
                >
      <ion-icon name="navigate-outline" slot="start"></ion-icon>
      Get Directions
    </ion-button>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: 250px;
      margin: 16px 0;
      border-radius: 8px;
    }
      ion-button{
        border-radius: 8px;
      }
  `]
})
export class RestaurantMapComponent implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  @Input() set latitude(value: number | undefined) {
    this._latitude = value ?? 0;
  }
  get latitude(): number {
    return this._latitude;
  }

  @Input() set longitude(value: number | undefined) {
    this._longitude = value ?? 0;
  }
  get longitude(): number {
    return this._longitude;
  }

  @Input() restaurantName: string = '';

  private _latitude: number = 0;
  private _longitude: number = 0;
  private map: any;

  ngOnInit() {
    this.initMap();
  }

  hasValidCoordinates(): boolean {
    return this._latitude !== 0 && this._longitude !== 0;
  }

  getDirections(): void {
    if (!this.hasValidCoordinates()) return;
    
    // Create Google Maps URL with destination coordinates
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this._latitude},${this._longitude}&destination_place_id=${this.restaurantName}`;
    
    // Open in new tab
    window.open(url, '_blank');
  }

  private initMap(): void {
    if (!this.hasValidCoordinates()) {
      console.warn('No valid coordinates provided');
      return;
    }

    const coordinates = { lat: this._latitude, lng: this._longitude };
    
    const mapOptions = {
      center: coordinates,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: true
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    new google.maps.Marker({
      position: coordinates,
      map: this.map,
      title: this.restaurantName
    });
  }
}