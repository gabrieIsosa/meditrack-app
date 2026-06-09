import { useEffect, useRef } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES = ["places"];

function InputDireccion({ onSelect }) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isLoaded || !inputRef.current || !window.google) return;

        const autocomplete =
            new window.google.maps.places.Autocomplete(
                inputRef.current,
                {
                    componentRestrictions: {
                        country: "ar",
                    },
                    types: ["address"],
                    fields: [
                        "formatted_address",
                        "geometry",
                        "place_id",
                    ],
                }
            );

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();

            if (!place.geometry) return;

            onSelect({
                direccion: place.formatted_address,
                latitud:
                    place.geometry.location.lat(),
                longitud:
                    place.geometry.location.lng(),
                placeId: place.place_id,
            });
        });
    }, [isLoaded, onSelect]);

    return (
        <input
            ref={inputRef}
            type="text"
            placeholder={isLoaded ? "Ingrese dirección" : "Cargando buscador de direcciones..."}
            disabled={!isLoaded}
            className="w-full border rounded px-3 py-2"
        />
    );
}

export default function DireccionAutocomplete({onSelect,}) {
    return (
        <InputDireccion onSelect={onSelect} />
    );
}