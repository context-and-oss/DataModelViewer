'use client'

import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarDatamodelView } from "./SidebarDatamodelView";
import { useDatamodelView, useDatamodelViewDispatch } from "@/contexts/DatamodelViewContext";
import { List } from "./List";
import { TimeSlicedSearch, SearchScope } from "./TimeSlicedSearch";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDatamodelData, useDatamodelDataDispatch } from "@/contexts/DatamodelDataContext";
import { updateURL } from "@/lib/url-utils";
import { useSearchParams } from "next/navigation";
import { AttributeType, EntityType, GroupType, RelationshipType } from "@/lib/Types";
import { useEntityFilters } from "@/contexts/EntityFiltersContext";

// Type for search results
type SearchResultItem =
    | { type: 'group'; group: GroupType }
    | { type: 'entity'; group: GroupType; entity: EntityType }
    | { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType }
    | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType };

export function DatamodelView() {
    const { setElement, expand } = useSidebar();

    useEffect(() => {
        setElement(<SidebarDatamodelView />);
        expand();
    }, [setElement]);

    return (
        <DatamodelViewContent />
    );
}

function DatamodelViewContent() {
    const { scrollToSection, scrollToAttribute, scrollToRelationship, restoreSection } = useDatamodelView();
    const datamodelDispatch = useDatamodelViewDispatch();
    const { groups, filtered, search } = useDatamodelData();
    const datamodelDataDispatch = useDatamodelDataDispatch();
    const { filters: entityFilters, selectedSecurityRoles } = useEntityFilters();
    const workerRef = useRef<Worker | null>(null);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
    const [searchResetKey, setSearchResetKey] = useState(0);
    const accumulatedResultsRef = useRef<SearchResultItem[]>([]); // Track all results during search
    const searchRequestIdRef = useRef(0); // Track search requests to ignore stale results
    const [searchScope, setSearchScope] = useState<SearchScope>({
        columnNames: true,
        columnDescriptions: true,
        columnDataTypes: false,
        tableDescriptions: false,
        relationships: false,
    });
    // Track which tab should be active for each entity during search navigation
    const [entityActiveTabs, setEntityActiveTabs] = useState<Map<string, number>>(new Map());

    // Helper function to get the tab index for a given type
    const getTabIndexForType = useCallback((entity: EntityType, type: 'attribute' | 'relationship') => {
        // Tab 0 is always Attributes
        if (type === 'attribute') return 0;

        // Tab 1 is Relationships if they exist, otherwise it would be Keys
        if (type === 'relationship' && entity.Relationships.length > 0) return 1;

        return 0; // fallback to attributes
    }, []);

    // Calculate total search results (count attributes and relationships)
    const totalResults = useMemo(() => {
        if (filtered.length === 0) return 0;

        // Get combined results and deduplicate to match navigation behavior
        const combinedResults = filtered.filter((item): item is { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType } | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType } =>
            item.type === 'attribute' || item.type === 'relationship'
        );

        if (combinedResults.length > 0) {
            // Deduplicate to match getSortedCombinedResults behavior
            // Note: We don't check DOM element existence here because relationships on inactive tabs
            // won't have DOM elements yet, but they should still be counted for navigation
            const seen = new Set<string>();
            let count = 0;
            for (const item of combinedResults) {
                const key = item.type === 'attribute'
                    ? `attr-${item.entity.SchemaName}-${item.attribute.SchemaName}`
                    : `rel-${item.entity.SchemaName}-${item.relationship.RelationshipSchema}`;

                if (!seen.has(key)) {
                    seen.add(key);
                    count++;
                }
            }
            return count;
        }

        // If no attributes or relationships, count entity-level matches (for security roles, table descriptions)
        const entityCount = filtered.filter(item => item.type === 'entity').length;
        return entityCount;
    }, [filtered]);
    const initialLocalValue = useSearchParams().get('globalsearch') || "";

    // Isolated search handlers - these don't depend on component state
    const handleSearch = useCallback((searchValue: string) => {
        // Clearing a search must also invalidate results still in flight.
        searchRequestIdRef.current += 1;
        if (workerRef.current && groups) {
            if (searchValue.length >= 3) {
                const currentRequestId = searchRequestIdRef.current;

                // Convert Map to plain object for worker
                const filtersObject: Record<string, { hideStandardFields: boolean; typeFilter: string }> = {};
                entityFilters.forEach((filter, entitySchemaName) => {
                    filtersObject[entitySchemaName] = filter;
                });

                workerRef.current.postMessage({
                    type: 'search',
                    data: searchValue,
                    entityFilters: filtersObject,
                    searchScope: searchScope,
                    selectedSecurityRoles: selectedSecurityRoles,
                    requestId: currentRequestId // Send request ID to worker
                });
            } else {
                // Clear search - reset to show all groups
                datamodelDataDispatch({ type: "SET_FILTERED", payload: [] });

                // Relocate section
                if (searchValue && searchValue.length === 0) {
                    restoreSection();
                }
            }
        }
        updateURL({ query: { globalsearch: searchValue.length >= 3 ? searchValue : "" } })
        datamodelDataDispatch({ type: "SET_SEARCH", payload: searchValue.length >= 3 ? searchValue : "" });
        setCurrentSearchIndex(searchValue.length >= 3 ? 1 : 0); // Reset to first result when searching, 0 when cleared
    }, [groups, datamodelDataDispatch, restoreSection, entityFilters, searchScope, selectedSecurityRoles]);

    const handleExitSearch = useCallback(() => {
        handleSearch("");
        datamodelDispatch({ type: "SET_LOADING", payload: false });
        setSearchResetKey(value => value + 1);
    }, [handleSearch, datamodelDispatch]);

    const handleLoadingChange = useCallback((isLoading: boolean) => {
        datamodelDispatch({ type: "SET_LOADING", payload: isLoading });
    }, [datamodelDispatch]);

    const handleSearchScopeChange = useCallback((newScope: SearchScope) => {
        setSearchScope(newScope);
        datamodelDataDispatch({ type: "SET_SEARCH_SCOPE", payload: newScope });
    }, [datamodelDataDispatch]);

    // Re-trigger search when scope or security roles change
    useEffect(() => {
        if (search && search.length >= 3) {
            handleSearch(search);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchScope, selectedSecurityRoles]); // Only trigger on searchScope or selectedSecurityRoles change, not handleSearch to avoid infinite loop

    // Helper function to get sorted combined results (attributes + relationships) on-demand
    // This prevents blocking the main thread during typing - sorting only happens during navigation
    const getSortedCombinedResults = useCallback(() => {
        const combinedResults = filtered.filter((item): item is { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType } | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType } =>
            item.type === 'attribute' || item.type === 'relationship'
        );

        if (combinedResults.length === 0) return [];

        // Deduplicate results - use a Set with unique keys
        const seen = new Set<string>();
        const deduplicatedResults = combinedResults.filter(item => {
            const key = item.type === 'attribute'
                ? `attr-${item.entity.SchemaName}-${item.attribute.SchemaName}`
                : `rel-${item.entity.SchemaName}-${item.relationship.RelationshipSchema}`;

            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });

        // Group results by entity to keep them together
        const resultsByEntity = new Map<string, Array<{ type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType } | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType }>>();

        for (const result of deduplicatedResults) {
            const entityKey = result.entity.SchemaName;
            if (!resultsByEntity.has(entityKey)) {
                resultsByEntity.set(entityKey, []);
            }
            resultsByEntity.get(entityKey)!.push(result);
        }

        // Create a stable sort order based on the groups data structure
        // This ensures consistent navigation order regardless of scroll position or tab state
        const entityOrder = new Map<string, number>();
        let orderIndex = 0;
        for (const group of groups) {
            for (const entity of group.Entities) {
                entityOrder.set(entity.SchemaName, orderIndex++);
            }
        }

        // Sort entities by their position in the groups data structure
        const sortedEntities = Array.from(resultsByEntity.entries()).sort((a, b) => {
            const [entitySchemaA] = a;
            const [entitySchemaB] = b;

            const orderA = entityOrder.get(entitySchemaA) ?? Number.MAX_SAFE_INTEGER;
            const orderB = entityOrder.get(entitySchemaB) ?? Number.MAX_SAFE_INTEGER;

            return orderA - orderB;
        });

        // Flatten back to array, keeping attributes BEFORE relationships within each entity
        const result: Array<{ type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType } | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType }> = [];
        for (const [, entityResults] of sortedEntities) {
            // Separate attributes and relationships for this entity
            const attributes = entityResults.filter((r): r is { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType } => r.type === 'attribute');
            const relationships = entityResults.filter((r): r is { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType } => r.type === 'relationship');

            // Sort attributes by Y position within the entity (if they exist in DOM)
            // Note: We don't filter out attributes that don't exist in DOM because the search worker
            // already applied all component-level filters
            attributes.sort((a, b) => {
                const elementA = document.getElementById(`attr-${a.entity.SchemaName}-${a.attribute.SchemaName}`);
                const elementB = document.getElementById(`attr-${b.entity.SchemaName}-${b.attribute.SchemaName}`);

                if (elementA && elementB) {
                    const rectA = elementA.getBoundingClientRect();
                    const rectB = elementB.getBoundingClientRect();
                    return rectA.top - rectB.top;
                }
                return 0;
            });

            // Sort relationships by Y position within the entity (if they exist in DOM)
            // Note: Relationships on inactive tabs won't have DOM elements, so we keep them in original order
            relationships.sort((a, b) => {
                const elementA = document.getElementById(`rel-${a.entity.SchemaName}-${a.relationship.RelationshipSchema}`);
                const elementB = document.getElementById(`rel-${b.entity.SchemaName}-${b.relationship.RelationshipSchema}`);

                if (elementA && elementB) {
                    const rectA = elementA.getBoundingClientRect();
                    const rectB = elementB.getBoundingClientRect();
                    return rectA.top - rectB.top;
                }
                return 0;
            });

            // Add all attributes first, then all relationships
            result.push(...attributes, ...relationships);
        }

        return result;
    }, [filtered, groups]);

    // Navigation handlers
    const handleNavigateNext = useCallback(() => {
        if (currentSearchIndex < totalResults) {
            const nextIndex = currentSearchIndex + 1;
            setCurrentSearchIndex(nextIndex);

            // Get sorted combined results (attributes sorted by Y position, relationships in original order)
            const combinedResults = getSortedCombinedResults();

            if (combinedResults.length > 0) {
                const nextResult = combinedResults[nextIndex - 1];
                if (nextResult) {
                    datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: nextResult.entity.SchemaName });
                    datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: nextResult.group.Name });

                    // Set the active tab based on result type
                    const tabIndex = getTabIndexForType(nextResult.entity, nextResult.type === 'attribute' ? 'attribute' : 'relationship');
                    setEntityActiveTabs(prev => new Map(prev).set(nextResult.entity.SchemaName, tabIndex));

                    // Scroll to the appropriate element
                    if (nextResult.type === 'attribute') {
                        scrollToAttribute(nextResult.entity.SchemaName, nextResult.attribute.SchemaName);
                    } else {
                        // For relationships, scroll to the specific relationship
                        scrollToRelationship(nextResult.entity.SchemaName, nextResult.relationship.RelationshipSchema);
                    }
                }
            } else {
                // Fallback to entity results if no attributes/relationships found (e.g., searching by entity name)
                const entityResults = filtered.filter((item): item is { type: 'entity'; group: GroupType; entity: EntityType } =>
                    item.type === 'entity'
                );

                const nextResult = entityResults[nextIndex - 1];
                if (nextResult) {
                    datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: nextResult.entity.SchemaName });
                    datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: nextResult.group.Name });
                    scrollToSection(nextResult.entity.SchemaName);
                }
            }
        }
    }, [currentSearchIndex, totalResults, getSortedCombinedResults, filtered, datamodelDispatch, scrollToAttribute, scrollToRelationship, scrollToSection, getTabIndexForType]);

    const handleNavigatePrevious = useCallback(() => {
        if (currentSearchIndex > 1) {
            const prevIndex = currentSearchIndex - 1;
            setCurrentSearchIndex(prevIndex);

            // Get sorted combined results (attributes sorted by Y position, relationships in original order)
            const combinedResults = getSortedCombinedResults();

            if (combinedResults.length > 0) {
                const prevResult = combinedResults[prevIndex - 1];
                if (prevResult) {
                    datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: prevResult.entity.SchemaName });
                    datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: prevResult.group.Name });

                    // Set the active tab based on result type
                    const tabIndex = getTabIndexForType(prevResult.entity, prevResult.type === 'attribute' ? 'attribute' : 'relationship');
                    setEntityActiveTabs(prev => new Map(prev).set(prevResult.entity.SchemaName, tabIndex));

                    // Scroll to the appropriate element
                    if (prevResult.type === 'attribute') {
                        scrollToAttribute(prevResult.entity.SchemaName, prevResult.attribute.SchemaName);
                    } else {
                        // For relationships, scroll to the specific relationship
                        scrollToRelationship(prevResult.entity.SchemaName, prevResult.relationship.RelationshipSchema);
                    }
                }
            } else {
                // Fallback to entity results if no attributes/relationships found (e.g., searching by entity name)
                const entityResults = filtered.filter((item): item is { type: 'entity'; group: GroupType; entity: EntityType } =>
                    item.type === 'entity'
                );

                const prevResult = entityResults[prevIndex - 1];
                if (prevResult) {
                    datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: prevResult.entity.SchemaName });
                    datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: prevResult.group.Name });
                    scrollToSection(prevResult.entity.SchemaName);
                }
            }
        }
    }, [currentSearchIndex, getSortedCombinedResults, filtered, datamodelDispatch, scrollToAttribute, scrollToRelationship, scrollToSection, getTabIndexForType]);

    useEffect(() => {
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL("./searchWorker.ts", import.meta.url));
        }

        // Initialize or re-initialize worker with groups when groups change
        if (workerRef.current && groups && groups.length > 0) {
            workerRef.current.postMessage({ type: "init", groups });
        }

        const worker = workerRef.current;
        if (!worker) return;

        const handleMessage = (e: MessageEvent) => {
            const message = e.data;
            const requestId = searchRequestIdRef.current;

            // Ignore stale search results
            if (message.requestId && message.requestId < searchRequestIdRef.current) {
                return; // Discard results from outdated searches
            }

            if (message.type === 'started') {
                datamodelDispatch({ type: "SET_LOADING", payload: true });
                // setSearchProgress(0);
                setCurrentSearchIndex(0);
                // Start with empty results to show loading state
                accumulatedResultsRef.current = []; // Reset accumulated results
                datamodelDataDispatch({ type: "SET_FILTERED", payload: [] });
            }
            else if (message.type === 'results') {
                // setSearchProgress(message.progress || 0);

                // Accumulate results in ref for immediate access
                accumulatedResultsRef.current = [...accumulatedResultsRef.current, ...message.data];

                // For chunked results, always append to existing
                datamodelDataDispatch({ type: "APPEND_FILTERED", payload: message.data });

                // Only handle completion logic when all chunks are received
                if (message.complete) {
                    datamodelDispatch({ type: "SET_LOADING", payload: false });
                    // Set to first result if we have any and auto-navigate to it
                    // Get combined attribute and relationship results
                    const combinedResults = accumulatedResultsRef.current.filter((item): item is { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType } | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType } =>
                        item.type === 'attribute' || item.type === 'relationship'
                    );

                    if (combinedResults.length > 0) {
                        setCurrentSearchIndex(1);
                        const firstResult = combinedResults[0];
                        datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: firstResult.entity.SchemaName });
                        datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: firstResult.group.Name });

                        // Set the active tab based on result type
                        const tabIndex = getTabIndexForType(firstResult.entity, firstResult.type === 'attribute' ? 'attribute' : 'relationship');
                        setEntityActiveTabs(prev => new Map(prev).set(firstResult.entity.SchemaName, tabIndex));

                        // Small delay to ensure virtual list is ready
                        setTimeout(() => {
                            if (requestId !== searchRequestIdRef.current) return;
                            if (firstResult.type === 'attribute') {
                                scrollToAttribute(firstResult.entity.SchemaName, firstResult.attribute.SchemaName);
                            } else {
                                scrollToRelationship(firstResult.entity.SchemaName, firstResult.relationship.RelationshipSchema);
                            }
                        }, 100);
                    } else {
                        // Fallback to entity results if no attributes/relationships found
                        const entityResults = accumulatedResultsRef.current.filter((item): item is { type: 'entity'; group: GroupType; entity: EntityType } =>
                            item.type === 'entity'
                        );

                        if (entityResults.length > 0) {
                            setCurrentSearchIndex(1);
                            const firstResult = entityResults[0];
                            datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: firstResult.entity.SchemaName });
                            datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: firstResult.group.Name });
                            setTimeout(() => {
                                if (requestId !== searchRequestIdRef.current) return;
                                scrollToSection(firstResult.entity.SchemaName);
                            }, 100);
                        }
                    }
                }
            }
            else {
                // Handle legacy format for backward compatibility
                const messageData = message as SearchResultItem[];
                datamodelDataDispatch({ type: "SET_FILTERED", payload: messageData });
                datamodelDispatch({ type: "SET_LOADING", payload: false });
                // Set to first result if we have any and auto-navigate to it
                // Get combined attribute and relationship results
                const combinedResults = messageData.filter((item): item is { type: 'attribute'; group: GroupType; entity: EntityType; attribute: AttributeType } | { type: 'relationship'; group: GroupType; entity: EntityType; relationship: RelationshipType } =>
                    item.type === 'attribute' || item.type === 'relationship'
                );

                if (combinedResults.length > 0) {
                    setCurrentSearchIndex(1);
                    const firstResult = combinedResults[0];
                    datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: firstResult.entity.SchemaName });
                    datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: firstResult.group.Name });

                    // Set the active tab based on result type
                    const tabIndex = getTabIndexForType(firstResult.entity, firstResult.type === 'attribute' ? 'attribute' : 'relationship');
                    setEntityActiveTabs(prev => new Map(prev).set(firstResult.entity.SchemaName, tabIndex));

                    // Small delay to ensure virtual list is ready
                    setTimeout(() => {
                        if (firstResult.type === 'attribute') {
                            scrollToAttribute(firstResult.entity.SchemaName, firstResult.attribute.SchemaName);
                        } else {
                            scrollToRelationship(firstResult.entity.SchemaName, firstResult.relationship.RelationshipSchema);
                        }
                    }, 100);
                } else {
                    // Fallback to entity results if no attributes/relationships found
                    const entityResults = messageData.filter((item): item is { type: 'entity'; group: GroupType; entity: EntityType } =>
                        item.type === 'entity'
                    );

                    if (entityResults.length > 0) {
                        setCurrentSearchIndex(1);
                        const firstResult = entityResults[0];
                        datamodelDispatch({ type: "SET_CURRENT_SECTION", payload: firstResult.entity.SchemaName });
                        datamodelDispatch({ type: "SET_CURRENT_GROUP", payload: firstResult.group.Name });
                        setTimeout(() => {
                            scrollToSection(firstResult.entity.SchemaName);
                        }, 100);
                    }
                }
            }
        };

        worker.addEventListener("message", handleMessage);
        return () => worker.removeEventListener("message", handleMessage);
    }, [datamodelDispatch, datamodelDataDispatch, groups, scrollToSection, scrollToAttribute, scrollToRelationship, getTabIndexForType]);

    if (!groups) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="w-32 h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 animate-indeterminate rounded-full" />
                <style>{`
                    @keyframes indeterminate {
                        0% { left: -33%; width: 33%; }
                        50% { left: 33%; width: 33%; }
                        100% { left: 100%; width: 33%; }
                    }
                    .animate-indeterminate {
                        position: relative;
                        animation: indeterminate 1.2s cubic-bezier(0.4,0,0.2,1) infinite;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="relative">
                {/* LOADING BAR - currently deprecated */}
                {/* {loading && (
                    <div className="absolute top-0 left-0 w-full h-1.5 z-50 overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-full bg-blue-100 opacity-40" />
                        <div 
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600" 
                            style={{ width: `${searchProgress}%`, transition: 'width 200ms ease-out' }}
                        />
                    </div>
                )} */}
                <TimeSlicedSearch
                    key={searchResetKey}
                    onSearch={handleSearch}
                    onLoadingChange={handleLoadingChange}
                    onNavigateNext={handleNavigateNext}
                    onNavigatePrevious={handleNavigatePrevious}
                    initialLocalValue={searchResetKey === 0 ? initialLocalValue : ""}
                    currentIndex={currentSearchIndex}
                    totalResults={totalResults}
                    onSearchScopeChange={handleSearchScopeChange}
                />
                <List setCurrentIndex={setCurrentSearchIndex} entityActiveTabs={entityActiveTabs} onExitSearch={handleExitSearch} />
            </div>
        </div>
    );
}