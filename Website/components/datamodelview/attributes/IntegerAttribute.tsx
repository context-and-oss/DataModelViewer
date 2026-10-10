import { IntegerAttributeType } from "@/lib/Types"
import { integerRange } from "@/lib/columnTypeText"
import { Typography } from "@mui/material"

export default function IntegerAttribute({ attribute, highlightMatch = text => text, highlightTerm = "" }: { attribute: IntegerAttributeType, highlightMatch?: (text: string, term: string) => string | React.JSX.Element, highlightTerm?: string }) {
    return (
        <>
            <Typography component="span" className="font-semibold text-xs md:font-bold md:text-sm">{highlightMatch(attribute.Format, highlightTerm)}</Typography>
            {" "}
            <Typography component="span" className="text-xs md:text-sm">{highlightMatch(integerRange(attribute.MinValue, attribute.MaxValue), highlightTerm)}</Typography>
        </>
    )
}
