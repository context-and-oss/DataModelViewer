import { DecimalAttributeType } from "@/lib/Types"
import { decimalRange, precisionText } from "@/lib/columnTypeText"
import { Typography } from "@mui/material"

export default function MoneyAttribute({ attribute, highlightMatch = text => text, highlightTerm = "" }: { attribute: DecimalAttributeType, highlightMatch?: (text: string, term: string) => string | React.JSX.Element, highlightTerm?: string }) {
    return (
        <>
            <Typography component="p">
                <Typography component="span" className="font-semibold text-xs md:font-bold md:text-sm">{highlightMatch(attribute.Type, highlightTerm)}</Typography>
                {" "}
                <Typography component="span" className="text-xs md:text-sm">{highlightMatch(decimalRange(attribute), highlightTerm)}</Typography>
            </Typography>
            <Typography component="p" className="text-xs md:text-sm">{highlightMatch(precisionText(attribute.Precision), highlightTerm)}</Typography>
        </>
    )
}
