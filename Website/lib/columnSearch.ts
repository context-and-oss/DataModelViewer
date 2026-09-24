import type { AttributeType } from "./Types";

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

    const values: string[] = [attribute.AttributeType];
    switch (attribute.AttributeType) {
        case "ChoiceAttribute":
            values.push("Choice", `${attribute.Type}-select`, ...attribute.Options.map(option => option.Name));
            break;
        case "StatusAttribute":
            values.push("Choice", "Single-select", ...attribute.Options.map(option => option.Name));
            break;
        case "DateTimeAttribute":
            values.push(attribute.Format, attribute.Behavior, `${attribute.Format} - ${attribute.Behavior}`);
            break;
        case "StringAttribute":
            values.push("Text", attribute.Format);
            break;
        case "IntegerAttribute":
            values.push(attribute.Format);
            break;
        case "GenericAttribute":
        case "DecimalAttribute":
            values.push(attribute.Type);
            break;
        case "LookupAttribute":
            values.push(...attribute.Targets.map(target => target.Name));
            break;
        case "BooleanAttribute":
            values.push(attribute.TrueLabel, attribute.FalseLabel);
            break;
    }
    return values.some(contains);
}
