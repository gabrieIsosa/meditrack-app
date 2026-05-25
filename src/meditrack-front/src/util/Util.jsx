/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { Hospital, Pill, FlaskConical, Warehouse, Building2, MapPin } from 'lucide-react';

export const getTipoStyles = (tipo) => {
    switch (tipo) {
        case 'HOSPITAL':
            return {
                background: '#FEF2F2',
                color: '#DC2626'
            };
        case 'FARMACIA':
            return {
                background: '#ECFDF3',
                color: '#059669'
            };
        case 'DEPOSITO':
            return {
                background: '#EFF6FF',
                color: '#2563EB'
            };
        case 'LABORATORIO':
            return {
                background: '#F5F3FF',
                color: '#7C3AED'
            };
        default:
            return {
                background: '#F3F4F6',
                color: '#374151'
            };
    }
};

export const iconos = {
    HOSPITAL: Hospital,
    FARMACIA: Pill,
    LABORATORIO: FlaskConical,
    DEPOSITO: Warehouse
};

export const DefaultIcon = Building2;
export const PinIcon = MapPin;