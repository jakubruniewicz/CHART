import requests
import json

url = "https://catalogue.dataspace.copernicus.eu/resto/api/collections/LANDSAT-8-ESA/search.json?"
response = requests.get(url)

if response.status_code == 200:
    landsat_data = response.json()
    with open('landsatData.json', 'w') as f:
        json.dump(landsat_data, f, indent=4)
else:
    print(f"Błąd przy pobieraniu danych: {response.status_code}")
