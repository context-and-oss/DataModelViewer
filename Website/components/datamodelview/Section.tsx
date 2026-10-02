'use client'

import { EntityType, GroupType } from "@/lib/Types"
import { EntityHeader } from "./entity/EntityHeader"
import { SecurityRoles } from "./entity/SecurityRoles"
import Keys from "./Keys"
import { Attributes } from "./Attributes"
import { Relationships } from "./Relationships"
import { highlightMatch } from "./List"
import React from "react"
import { Box, Paper, Tab, Tabs } from "@mui/material"
import CustomTabPanel from "../shared/elements/TabPanel"
import { KeyRounded, SellRounded, ShareRounded } from "@mui/icons-material"

interface ISectionProps {
    entity: EntityType;
    group: GroupType;
    search?: string;
    activeTab?: number; // External tab control for search navigation
    highlightSecurityRole?: boolean; // Highlight when entity matches selected security roles
}

export const Section = React.memo(
    ({ entity, group, search, activeTab, highlightSecurityRole }: ISectionProps) => {
        const [tab, setTab] = React.useState(0);

        // Update local tab state when external activeTab prop changes
        React.useEffect(() => {
            if (activeTab !== undefined) {
                setTab(activeTab);
            }
        }, [activeTab]);
        const [visibleAttributeCount, setVisibleAttributeCount] = React.useState(entity.Attributes.length);
        const [visibleRelationshipCount, setVisibleRelationshipCount] = React.useState(entity.Relationships.length);

        const handleTabChange = React.useCallback((event: React.SyntheticEvent, newValue: number) => {
            setTab(newValue);
        }, []);

        const handleVisibleAttributeCountChange = React.useCallback((count: number) => {
            setVisibleAttributeCount(count);
        }, []);

        const handleVisibleRelationshipCountChange = React.useCallback((count: number) => {
            setVisibleRelationshipCount(count);
        }, []);

        return (
            <Box data-entity-schema={entity.SchemaName} data-group={group.Name} className="mb-10">
                <Paper
                    className="rounded-lg"
                    sx={{
                        backgroundColor: 'background.paper',
                    }}
                    variant="outlined"
                >
                    <Box className="flex flex-col xl:flex-row min-w-0 p-6">
                        <EntityHeader entity={entity} />
                        {entity.SecurityRoles.length > 0 && (
                            <div className="md:w-full xl:w-2/3 md:border-t xl:border-t-0 mt-6 xl:mt-0 xl:pt-0">
                                <SecurityRoles roles={entity.SecurityRoles} highlightMatch={highlightMatch} highlightTerm={search || ''} highlightSecurityRole={highlightSecurityRole} />
                            </div>
                        )}
                    </Box>

                    <Box className="px-6 pb-6">
                        <Paper className="rounded-lg" variant="outlined">
                            <Tabs
                                value={tab}
                                onChange={handleTabChange}
                                className="border-b"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    borderColor: 'border.main',
                                }}
                            >
                                <Tab
                                    label={
                                        <div className="flex items-center min-w-[120px] sm:min-w-[140px] px-2 py-1 text-xs sm:text-sm">
                                            <SellRounded className="mr-2 h-4 w-4 shrink-0" />
                                            <span className="truncate">Columns [{visibleAttributeCount}]</span>
                                        </div>
                                    }
                                />
                                {entity.Relationships.length > 0 && (
                                    <Tab
                                        label={
                                            <div className="flex items-center min-w-[140px] sm:min-w-[160px] px-2 py-1 text-xs sm:text-sm">
                                                <ShareRounded className="mr-2 h-4 w-4 shrink-0" />
                                                <span className="truncate">Relationships [{visibleRelationshipCount}]</span>
                                            </div>
                                        }
                                    />
                                )}
                                {entity.Keys.length > 0 && (
                                    <Tab
                                        label={
                                            <div className="flex items-center min-w-[100px] sm:min-w-[120px] px-2 py-1 text-xs sm:text-sm">
                                                <KeyRounded className="mr-2 h-4 w-4 shrink-0" />
                                                <span className="truncate">Keys [{entity.Keys.length}]</span>
                                            </div>
                                        }
                                    />
                                )}
                            </Tabs>

                            <CustomTabPanel value={tab} index={0} className="m-0 p-0">
                                <Attributes entity={entity} search={search} onVisibleCountChange={handleVisibleAttributeCountChange} />
                            </CustomTabPanel>
                            {entity.Relationships.length > 0 && (
                                <CustomTabPanel value={tab} index={entity.Keys.length > 0 ? 1 : 1} className="m-0 p-0">
                                    <Relationships entity={entity} search={search} onVisibleCountChange={handleVisibleRelationshipCountChange} />
                                </CustomTabPanel>
                            )}
                            {entity.Keys.length > 0 && (
                                <CustomTabPanel
                                    value={tab}
                                    index={entity.Relationships.length > 0 ? 2 : 1}
                                    className="m-0 p-0"
                                >
                                    <Keys entity={entity} search={search} />
                                </CustomTabPanel>
                            )}
                        </Paper>
                    </Box>
                </Paper>
            </Box>
        )
    },
    // Custom comparison function to prevent unnecessary re-renders
    (prevProps, nextProps) => {
        // Only re-render if entity, search, group, activeTab, or highlightSecurityRole changes
        return prevProps.entity.SchemaName === nextProps.entity.SchemaName &&
            prevProps.search === nextProps.search &&
            prevProps.group.Name === nextProps.group.Name &&
            prevProps.activeTab === nextProps.activeTab &&
            prevProps.highlightSecurityRole === nextProps.highlightSecurityRole;
    }
);

Section.displayName = "Section";