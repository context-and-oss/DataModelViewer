'use client'

import { Tooltip } from "@mui/material";
import { CascadeConfigurationType, CascadeType } from "@/lib/Types";

const actions = ["Assign", "Reparent", "Delete", "Share", "Unshare", "Merge", "Archive", "RollupView"] as const;
const configurableActions = ["Assign", "Reparent", "Share", "Unshare"] as const;

export function getRelationshipBehavior(config: CascadeConfigurationType): "Referential" | "Parental" | "Custom" {
    // Merge depends on table support; Archive and RollupView are independent settings.
    // They remain visible in the details without changing the behavior family.
    if (configurableActions.every(action => config[action] === CascadeType.None) &&
        (config.Delete === CascadeType.RemoveLink || config.Delete === CascadeType.Restrict)) {
        return "Referential";
    }
    if (configurableActions.every(action => config[action] === CascadeType.Cascade) &&
        config.Delete === CascadeType.Cascade) {
        return "Parental";
    }
    return "Custom";
}

export function CascadeConfiguration({ config }: { config: CascadeConfigurationType | null }): JSX.Element {
    if (!config) {
        return <span>None</span>
    }

    return (
        <Tooltip describeChild title={
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 whitespace-nowrap">
                {actions.map(action => (
                    <div key={action} className="contents">
                        <dt>{action === "RollupView" ? "Rollup View" : action}:</dt>
                        <dd>{config[action] == null ? "Not specified" : CascadeType[config[action]] ?? `Unknown (${config[action]})`}</dd>
                    </div>
                ))}
            </dl>
        }>
            <span tabIndex={0} className="cursor-help underline decoration-dotted underline-offset-4">
                {getRelationshipBehavior(config)}
            </span>
        </Tooltip>
    )
}
