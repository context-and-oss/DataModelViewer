import { FileAttributeType } from "@/lib/Types";
import { fileSize } from "@/lib/columnTypeText";
import { Typography } from "@mui/material";

export default function FileAttribute({ attribute, highlightMatch = text => text, highlightTerm = "" }: { attribute: FileAttributeType, highlightMatch?: (text: string, term: string) => string | React.JSX.Element, highlightTerm?: string }) {
    return (
        <>
            <Typography component="span" className="font-semibold text-xs md:font-bold md:text-sm">{highlightMatch("File", highlightTerm)}</Typography>
            {" "}
            <Typography component="span" className="text-xs md:text-sm">{highlightMatch(fileSize(attribute.MaxSize), highlightTerm)}</Typography>
        </>
    )
}