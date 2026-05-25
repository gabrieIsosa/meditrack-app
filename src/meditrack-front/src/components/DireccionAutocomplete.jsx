import { useEffect, useRef } from "react";

function InputDireccion({ onSelect }) {
    const inputRef = useRef(null);

    useEffect(() => {
        if (!window.google || !inputRef.current) return;

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
    }, [onSelect]);

    return (
        <input
            ref={inputRef}
            type="text"
            placeholder="Ingrese dirección"
            className="w-full border rounded px-3 py-2"
        />
    );
}

export default function DireccionAutocomplete({onSelect,}) {
    return (
        <InputDireccion onSelect={onSelect} />
    );
}