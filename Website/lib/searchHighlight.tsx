import React from "react";

function marked(text: string, start: number, end: number) {
    return <>{text.slice(0, start)}<mark className="bg-yellow-200 text-black px-0.5 rounded">{text.slice(start, end)}</mark>{text.slice(end)}</>;
}

export function highlightMatch(text: string, search: string) {
    const term = search.trim();
    if (term.length < 3) return text;
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    return index < 0 ? text : marked(text, index, index + term.length);
}

export function highlightTypeMatch(text: string, search: string) {
    const highlighted = highlightMatch(text, search);
    const term = search.trim();
    if (highlighted !== text || term.length < 3 || !/^-?\d+(?:\.\d+)?$/.test(term)) return highlighted;

    // Map raw numeric matches back onto the displayed thousands/decimal separators.
    for (const match of text.matchAll(/-?\d+(?:\.\d{3})*(?:,\d+)?/g)) {
        const positions: number[] = [];
        let raw = "";
        for (let i = 0; i < match[0].length; i++) {
            const char = match[0][i];
            if (char === ".") continue;
            positions.push(match.index + i);
            raw += char === "," ? "." : char;
        }
        const index = raw.indexOf(term);
        if (index >= 0) return marked(text, positions[index], positions[index + term.length - 1] + 1);
    }
    return text;
}
