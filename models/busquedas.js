const fs = require("fs");

const axios = require("axios");

class Busquedas {
    historial = [];
    dbPath = "./db/database.json"

    constructor(){
        //Leer DB si existe
        this.leerDB();
    }

    get historialCapitalizado(){
        //Capitalizar cada palabra
        return this.historial.map(lugar => {
            let palabras = lugar.split(" ");
            palabras = palabras.map(p => p[0].toUpperCase() + p.substring(1))

            return palabras.join(" ");
        })
    }

    get paramsMapBox(){
        return {
            "access_token": process.env.MAPBOX_KEY || "",
            "limit": 5,
            "language": "es"
        }
    }

    get paramsWeather(){
        return {
            appid: process.env.OPENWEATHER_KEY,
            units: "metric",
            lang: "es",
        }
    }

    async ciudad(lugar = ""){
        try {
            //Petición HTTP
            // console.log("Ciudad:", lugar);
            // const resp = await axios.get("https://api.mapbox.com/geocoding/v5/mapbox.places/Madrid.json?access_token=pk.eyJ1Ijoia2xlcml0aCIsImEiOiJja2tvZHh4Y3YwMDhnMnBvY3ozbHUxdGJvIn0.3zptKSSxJrM5VmfjnkKMYA&limit=5&language=es");

            const instance = axios.create({
                baseURL: `https://api.mapbox.com/geocoding/v5/mapbox.places/${lugar}.json`,
                params: this.paramsMapBox
            })

            const resp = await instance.get();
            //REGRESAMOS UN OBJETO DE FORMA IMPLICITA PONIENDO PARENTESIS Y LUEGO LLAVES
            return resp.data.features.map(lugar => ({
                id: lugar.id,
                nombre: lugar.place_name,
                lng: lugar.center[0],
                lat: lugar.center[1],
            }));

            //Extraemos la data
            // console.log(resp.data);
        } catch (error) {
            return [];
        }
    }

    async climaLugar(lat, lon){
        try {
            //crear la instancia axios.create()
            const instance = axios.create({
                baseURL: `https://api.openweathermap.org/data/2.5/weather`,
                params: {...this.paramsWeather, lat, lon}
            })

            //de la respuesta debemos extraer la data
            const resp = await instance.get();
            // console.log(resp);
            const {weather, main} = resp.data;

            return{
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp,
            };

        } catch (error) {
            console.log(error);
        }
    };


    agregarHistorial(lugar = ""){

        if(this.historial.includes(lugar.toLocaleLowerCase())){
            return;
        }
        this.historial = this.historial.splice(0,5);

        this.historial.unshift(lugar.toLocaleLowerCase());

        //GRABAR EN BD
        this.guardarDB();
    }

    guardarDB(){
        const payload = {
            historial: this.historial
        }

        fs.writeFileSync(this.dbPath, JSON.stringify(payload));
    };

    leerDB(){
        if(!fs.existsSync(this.dbPath)) return;

        const info = fs.readFileSync(this.dbPath, {encoding: 'utf-8'});
        const data = JSON.parse(info);

        this.historial = data.historial;
    }
};

module.exports = Busquedas;