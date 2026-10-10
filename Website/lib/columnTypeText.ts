import type { AttributeType, DecimalAttributeType } from "./Types";
import { formatNumberSeperator } from "./utils";

export function integerBound(value: number): string {
    if (value === 2147483647) return "Max";
    if (value === -2147483648) return "Min";
    return formatNumberSeperator(value);
}

export function decimalBound(value: number, type: DecimalAttributeType["Type"]): string {
    const limit = type === "Money" ? 922337203685477 : 100000000000;
    if (value === limit) return "Max";
    if (value === -limit) return "Min";
    return formatNumberSeperator(value);
}

export const textLength = (value: number) => `(${formatNumberSeperator(value)})`;
export const fileSize = (value: number) => `(Max ${formatNumberSeperator(value)}KB)`;
export const integerRange = (min: number, max: number) => `(${integerBound(min)} to ${integerBound(max)})`;
export const decimalRange = (attribute: DecimalAttributeType) => `(${decimalBound(attribute.MinValue, attribute.Type)} to ${decimalBound(attribute.MaxValue, attribute.Type)})`;
export const precisionText = (value: number) => `Precision: ${value}`;

// Include rendered text and raw numbers, so both 2000 and the displayed 2.000 work.
export function columnTypeSearchValues(attribute: AttributeType): string[] {
    const values: string[] = [attribute.AttributeType];
    const number = (value: number) => values.push(String(value), formatNumberSeperator(value));
    switch (attribute.AttributeType) {
        case "ChoiceAttribute": {
            values.push("Choice", `${attribute.Type}-select`);
            for (const option of attribute.Options) {
                values.push(option.Name, option.Description ?? "");
                number(option.Value);
            }
            const defaultOption = attribute.Options.find(option => option.Value === attribute.DefaultValue);
            if (attribute.DefaultValue !== null && attribute.DefaultValue !== -1 && defaultOption) values.push(`Default: ${defaultOption.Name}`);
            break;
        }
        case "StatusAttribute":
            values.push("Choice", "Single-select", "State/Status");
            for (const option of attribute.Options) {
                values.push(option.Name, option.State);
                number(option.Value);
            }
            break;
        case "DateTimeAttribute":
            values.push(attribute.Format, attribute.Behavior, `${attribute.Format} - ${attribute.Behavior}`);
            break;
        case "StringAttribute":
            values.push("Text", attribute.Format, `Text ${textLength(attribute.MaxLength)}${attribute.Format === "Text" ? "" : ` - ${attribute.Format}`}`);
            number(attribute.MaxLength);
            break;
        case "IntegerAttribute":
            values.push(`${attribute.Format} ${integerRange(attribute.MinValue, attribute.MaxValue)}`);
            number(attribute.MinValue);
            number(attribute.MaxValue);
            break;
        case "DecimalAttribute":
            values.push(`${attribute.Type} ${decimalRange(attribute)}`, precisionText(attribute.Precision));
            number(attribute.MinValue);
            number(attribute.MaxValue);
            number(attribute.Precision);
            break;
        case "GenericAttribute":
            values.push(attribute.Type);
            break;
        case "LookupAttribute":
            values.push("Lookup", ...attribute.Targets.map(target => target.Name));
            break;
        case "BooleanAttribute":
            values.push("Boolean", "True", "False", attribute.TrueLabel, attribute.FalseLabel);
            if (attribute.DefaultValue !== null) values.push(`Default: ${attribute.DefaultValue ? attribute.TrueLabel : attribute.FalseLabel}`);
            break;
        case "FileAttribute":
            values.push(`File ${fileSize(attribute.MaxSize)}`);
            number(attribute.MaxSize);
            break;
    }
    return values;
}
