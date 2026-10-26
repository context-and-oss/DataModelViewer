import { useState } from 'react';
import { AttributeType, EntityType } from '@/lib/Types';

export type AttributeSelectionMode = 'minimal' | 'custom-lookups' | 'all-lookups' | 'custom';

export interface AttributeSelectionConfig {
    mode: AttributeSelectionMode;
    customSelectedAttributes: string[];
}

export const useAttributeSelection = (initialMode: AttributeSelectionMode = 'custom-lookups') => {
    const [attributeMode, setAttributeMode] = useState<AttributeSelectionMode>(initialMode);
    const [customSelectedAttributes, setCustomSelectedAttributes] = useState<string[]>([]);

    const getSelectedAttributes = (entity: EntityType): string[] => {
        switch (attributeMode) {
            case 'minimal':
                // Only primary key (handled by default in useDiagram)
                return [];
            case 'custom-lookups':
                return entity.Attributes
                    .filter(attr => attr.AttributeType === "LookupAttribute" && attr.IsCustomAttribute)
                    .map(attr => attr.SchemaName);
            case 'all-lookups':
                return entity.Attributes
                    .filter(attr => attr.AttributeType === "LookupAttribute")
                    .map(attr => attr.SchemaName);
            case 'custom':
                return customSelectedAttributes;
            default:
                return [];
        }
    };

    const initializeCustomAttributes = (entity: EntityType) => {
        // Initialize with current default (custom lookups)
        const defaultSelected = entity.Attributes
            .filter(attr => attr.AttributeType === "LookupAttribute" && attr.IsCustomAttribute)
            .map(attr => attr.SchemaName);
        setCustomSelectedAttributes(defaultSelected);
    };

    const toggleCustomAttribute = (attributeSchemaName: string, checked: boolean) => {
        if (checked) {
            setCustomSelectedAttributes(prev => [...prev, attributeSchemaName]);
        } else {
            setCustomSelectedAttributes(prev => prev.filter(name => name !== attributeSchemaName));
        }
    };

    const resetCustomAttributes = () => {
        setCustomSelectedAttributes([]);
    };

    const getAttributeModeDescription = (mode: AttributeSelectionMode): string => {
        switch (mode) {
            case 'minimal':
                return 'Primary key only';
            case 'custom-lookups':
                return 'Custom lookup columns';
            case 'all-lookups':
                return 'All lookup columns';
            case 'custom':
                return 'Pick specific columns';
            default:
                return '';
        }
    };

    return {
        attributeMode,
        setAttributeMode,
        customSelectedAttributes,
        setCustomSelectedAttributes,
        getSelectedAttributes,
        initializeCustomAttributes,
        toggleCustomAttribute,
        resetCustomAttributes,
        getAttributeModeDescription,
    };
};
