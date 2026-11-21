import datetime
import json
import math
import os
import urllib.request

import folium
import googlemaps
import pandas as pd
import polyline
import requests
from dotenv import load_dotenv

load_dotenv()


class WeatherMapping:
    def __init__(self, start_address:str, end_address:str, travel_date:datetime.date):
        # initialize endpoints and api keys
        self.endpoint = "https://maps.googleapis.com/maps/api/directions/json?"
        self.googlemaps = googlemaps.Client(os.getenv("GMAPS_KEY"))
        self.owm_key = os.getenv("OWM_KEY")

        self.start_address = start_address.replace(' ', '+')
        self.end_address = end_address.replace(' ', '+')
        self.date_of_travel = travel_date

        self.nav_request = None
        self.request = None
        self.response = None
        self.directions = None
        self.route_gps_coords = None
        self.steps_in_route = None
        self.possible_marker_locations = None
        self.weather_at_checkpoint = None
        self.popup_info = None
        self.gps_coords = None
        self.Row_list = None

    def _get_route_coords(self):
        """
        makes request to google directions api and creates a pandas dataframe to hold lat/lon pairs of route
        """

        # make request and get response
        self.nav_request = f"""origin={self.start_address}&destination={self.end_address}&key={os.getenv("GMAPS_KEY")}"""
        self.request = self.endpoint + self.nav_request
        self.response = urllib.request.urlopen(self.request).read()
        self.directions = json.loads(self.response)

        # create empty dataframe. lat = 0, lng = 1
        route_gps_coords = pd.DataFrame(columns=[0, 1])

        # determine number of steps in route
        self.steps_in_route = len(
            self.directions['routes'][0]['legs'][0]['steps'])

        # put gps coords and add to dataframe
        for i in range(self.steps_in_route):
            route_gps_coords = pd.concat([route_gps_coords,
                                          pd.DataFrame(polyline.decode((self.directions['routes'][0]['legs'][0]['steps'][i]['polyline']['points'])))])

        # reset index
        route_gps_coords = route_gps_coords.reset_index(drop=True)

        # get route coordinates as a "row list"
        self.Row_list = []

        for rows in route_gps_coords.itertuples():
            # Create list for the current row
            my_list = [rows[1], rows[2]]

            # append the list to the final list
            self.Row_list.append(my_list)

        return route_gps_coords

    def _check_weather(self, lat, lon):
        """
        Returns the Openweathermaps city ID if matching weather on matching travel date are found at that location 

        Parameters:
            lat (float): latitude of location
            lon (float): longitude of location

        Returns:
            city_id (int/None): Int if match found, None otherwise
        """

        url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={self.owm_key}'
        response = requests.post(url)
        response = response.json()

        for i in response['list']:
            forecast_date = datetime.datetime.strptime(
                i['dt_txt'], "%Y-%m-%d %H:%M:%S").date().strftime('%Y-%m-%d')
            if forecast_date == self.date_of_travel:
                forecast_weather = i['weather'][0]['main']
                city_id = response['city']['id']

        return city_id, forecast_weather

    def _get_checkpoint_locations(self):
        """
        this function finds the locations (lat/lon) to check for weather along a route. every 10 miles.
        return: list 
        """
        checkpoint_locations = []

        route_length = int(
            self.directions['routes'][0]['legs'][0]['distance']['text'].split(' ')[0])

        self.number_of_checkpoints = math.ceil(route_length/20)

        for i in range(1, len(self.route_gps_coords),  math.floor(len(self.route_gps_coords)/self.number_of_checkpoints)):
            checkpoint_locations.append({'route_index': i,
                                         'location': [self.route_gps_coords.iloc[i].values[0], self.route_gps_coords.iloc[i].values[1]]})

        return checkpoint_locations

    def create_map(self):
        # get the gps coordinates for the route.
        self.route_gps_coords = self._get_route_coords()

        # create and center map at center of route
        map = folium.Map(location=self.Row_list[round(
            len(self.route_gps_coords)/2)], zoom_start=8)

        # add route polylines to map
        folium.PolyLine(locations=self.Row_list,
                        line_opacity=0.5).add_to(map)

        # starting marker
        folium.Marker(self.Row_list[0], popup='Origin').add_to(map)

        # ending marker
        folium.Marker(self.Row_list[-1],
                      popup='Destination').add_to(map)

        # get checkpoint locations
        self.checkpoint_locations = self._get_checkpoint_locations()

        # add markers to map
        for i in self.checkpoint_locations:
            # get city id at location if weather on travel date match. none returned if no match
            city_id, weather = self._check_weather(i['location'][0], i['location'][1])

            # custom icon creation. this has to be done at each iteration
            if weather == 'Snow':
                popup_icon = folium.CustomIcon(
                    'static/snowflake.png', icon_size=(40, 40))
            elif weather == 'Rain':
                popup_icon = folium.CustomIcon(
                    'static/raindrops.png', icon_size=(40, 40))
            elif weather == 'Clear':
                popup_icon = folium.CustomIcon(
                    'static/sun.png', icon_size=(40, 40))            
            else:
                popup_icon = folium.CustomIcon(
                    'static/clouds.png', icon_size=(40, 40))


            url = f'https://openweathermap.org/city/{city_id}'
            weblink = f'''<a href=" {url} "target="_blank" style="font-size: 1em; text-align: center;"> {'Link to forecast'} {'</a>'}'''

            iframe = folium.IFrame(
                html=weblink, width=250, height=40)

            popup = folium.Popup(iframe)

            folium.Marker((i['location'][0], i['location']
                            [1]), popup=popup, icon=popup_icon).add_to(map)

        return map

