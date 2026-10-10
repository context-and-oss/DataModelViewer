import type { AttributeType } from "./Types";
import { columnTypeSearchValues } from "./columnTypeText";

export interface ColumnSearchScope {
    columnNames: boolean;
    columnDescriptions: boolean;
    columnDataTypes: boolean;
}

// Keep worker results and the rendered column rows on the same matching rules.
export function columnMatchesSearch(attribute: AttributeType, query: string, scope: ColumnSearchScope): boolean {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    const contains = (value: string | null | undefined) => !!value?.toLowerCase().includes(term);
    if (scope.columnNames && (contains(attribute.SchemaName) || contains(attribute.DisplayName))) return true;
    if (scope.columnDescriptions && contains(attribute.Description)) return true;
    if (!scope.columnDataTypes) return false;

    return columnTypeSearchValues(attribute).some(contains);
}
