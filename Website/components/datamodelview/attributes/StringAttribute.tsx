'use client'

import { StringAttributeType } from "@/lib/Types";
import { textLength } from "@/lib/columnTypeText";
import { Typography } from "@mui/material";
import React from "react";

export default function StringAttribute({ attribute, highlightMatch = text => text, highlightTerm = "" } : { attribute: StringAttributeType, highlightMatch?: (text: string, term: string) => string | React.JSX.Element, highlightTerm?: string }) {
    return (
        <>
            <Typography component="span" className="font-semibold text-xs md:font-bold md:text-sm">{highlightTerm ? highlightMatch("Text", highlightTerm) : "Text"}</Typography>
            {" "}
            <Typography component="span" className="text-xs md:text-sm">
                {highlightMatch(textLength(attribute.MaxLength), highlightTerm)}
                {attribute.Format !== "Text" && (
                    <>
                        {" - "}
                        {highlightTerm ? highlightMatch(attribute.Format, highlightTerm) : attribute.Format}
                    </>
                )}
            </Typography>
        </>
    );
}
