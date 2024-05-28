import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  apiLoaded: Observable<boolean>;

  zoom = 6;
  mapCenter = {
    lat: 23.806921,
    lng: 90.377078
  }
  polylinePoints = [
    { lat: 24.847916, lng: 89.369764 },
    { lat: 23.806921, lng: 90.377078 },
    { lat: 24.919298, lng: 91.831699 }
  ];
  circleMapRadius = 50000;

  constructor(httpClient: HttpClient) {
    this.apiLoaded = httpClient.jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyBNcjxo_35qnEG17dQvvftWa68eZWepYE0', 'callback')
        .pipe(
          map(() => true),
          catchError(() => of(false)),
        );
  }

  ngOnInit() {
  }

  circleMapRadiusChange(radius) {
    this.circleMapRadius = radius;
    // console.log(e)
  }
}
