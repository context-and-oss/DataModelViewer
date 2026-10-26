'use client'

import { StringAttributeType } from "@/lib/Types";
import { formatNumberSeperator } from "@/lib/utils";
import { Typography } from "@mui/material";
import React from "react";

export default function StringAttribute({ attribute, highlightMatch, highlightTerm } : { attribute: StringAttributeType, highlightMatch?: (text: string, term: string) => string | React.JSX.Element, highlightTerm?: string }) {
    return (
        <>
            <Typography component="span" className="font-semibold text-xs md:font-bold md:text-sm">{highlightMatch && highlightTerm ? highlightMatch("Text", highlightTerm) : "Text"}</Typography>
            {" "}
            <Typography component="span" className="text-xs md:text-sm">
                ({formatNumberSeperator(attribute.MaxLength)})
                {attribute.Format !== "Text" && (
                    <>
                        {" - "}
                        {highlightMatch && highlightTerm ? highlightMatch(attribute.Format, highlightTerm) : attribute.Format}
                    </>
                )}
            </Typography>
        </>
    );
}
