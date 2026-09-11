'use client'

import { columnMatchesSearch } from "@/lib/columnSearch"
import { EntityType, AttributeType } from "@/lib/Types"
import { useState, useEffect } from "react"
import { AttributeDetails } from "./entity/AttributeDetails"
import BooleanAttribute from "./attributes/BooleanAttribute"
import ChoiceAttribute from "./attributes/ChoiceAttribute"
import DateTimeAttribute from "./attributes/DateTimeAttribute"
import DecimalAttribute from "./attributes/DecimalAttribute"
import FileAttribute from "./attributes/FileAttribute"
import GenericAttribute from "./attributes/GenericAttribute"
import IntegerAttribute from "./attributes/IntegerAttribute"
import LookupAttribute from "./attributes/LookupAttribute"
import StatusAttribute from "./attributes/StatusAttribute"
import StringAttribute from "./attributes/StringAttribute"
import React from "react"
import { highlightMatch } from "../datamodelview/List";
import { Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography, useTheme } from "@mui/material"
import { ClearRounded, SearchRounded, Visibility, VisibilityOff, ArrowUpwardRounded, ArrowDownwardRounded } from "@mui/icons-material"
import { useEntityFiltersDispatch } from "@/contexts/EntityFiltersContext"
import { useDatamodelData } from "@/contexts/DatamodelDataContext"

type SortDirection = 'asc' | 'desc' | null
type SortColumn = 'displayName' | 'schemaName' | 'type' | 'description' | null

interface IAttributeProps {
    entity: EntityType
    search?: string
    onVisibleCountChange?: (count: number) => void
}

export const Attributes = ({ entity, search = "", onVisibleCountChange }: IAttributeProps) => {
    const [sortColumn, setSortColumn] = useState<SortColumn>("displayName")
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [hideStandardFields, setHideStandardFields] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState("")

    const theme = useTheme();
    const entityFiltersDispatch = useEntityFiltersDispatch();
    const { searchScope } = useDatamodelData();

    // Report filter state changes to context
    useEffect(() => {
        entityFiltersDispatch({
            type: "SET_ENTITY_FILTERS",
            entitySchemaName: entity.SchemaName,
            filters: {
                hideStandardFields,
                typeFilter
            }
        });
    }, [hideStandardFields, typeFilter, entity.SchemaName, entityFiltersDispatch]);

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            if (sortDirection === 'asc') {
                setSortDirection('desc')
            } else if (sortDirection === 'desc') {
                setSortColumn(null)
                setSortDirection(null)
            } else {
                setSortDirection('asc')
            }
        } else {
            setSortColumn(column)
            setSortDirection('asc')
        }
    }

    // Helper function to check if an attribute matches a search query
    const attributeMatchesSearch = (attr: AttributeType, query: string): boolean => {
        const basicMatch = attr.DisplayName.toLowerCase().includes(query) ||
            attr.SchemaName.toLowerCase().includes(query) ||
            (attr.Description && attr.Description.toLowerCase().includes(query));

        // Check options for ChoiceAttribute and StatusAttribute
        let optionsMatch = false;
        if (attr.AttributeType === 'ChoiceAttribute' || attr.AttributeType === 'StatusAttribute') {
            optionsMatch = attr.Options.some(option => option.Name.toLowerCase().includes(query));
        }

        return basicMatch || optionsMatch;
    };

    const getSortedAttributes = () => {
        let filteredAttributes = entity.Attributes

        if (typeFilter !== "all") {
            if (typeFilter === "ChoiceAttribute") {
                // When Choice is selected, show both ChoiceAttribute and StatusAttribute
                filteredAttributes = filteredAttributes.filter(attr =>
                    attr.AttributeType === "ChoiceAttribute" || attr.AttributeType === "StatusAttribute"
                )
            } else {
                filteredAttributes = filteredAttributes.filter(attr => attr.AttributeType === typeFilter)
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filteredAttributes = filteredAttributes.filter(attr => attributeMatchesSearch(attr, query))
        }

        // Also filter by parent search prop if provided
        if (search && search.length >= 3) {
            const query = search.toLowerCase()
            filteredAttributes = filteredAttributes.filter(attr => columnMatchesSearch(attr, query, searchScope))
        }

        if (hideStandardFields) filteredAttributes = filteredAttributes.filter(attr => (attr.IsCustomAttribute || attr.IsStandardFieldModified) && !attr.SchemaName.endsWith("Base"));

        if (!sortColumn || !sortDirection) return filteredAttributes

        return [...filteredAttributes].sort((a, b) => {
            let aValue = ''
            let bValue = ''

            switch (sortColumn) {
                case 'displayName':
                    aValue = a.DisplayName
                    bValue = b.DisplayName
                    break
                case 'schemaName':
                    aValue = a.SchemaName
                    bValue = b.SchemaName
                    break
                case 'type':
                    aValue = a.AttributeType
                    bValue = b.AttributeType
                    break
                case 'description':
                    aValue = a.Description || ''
                    bValue = b.Description || ''
                    break
                default:
                    return 0
            }

            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue)
            } else {
                return bValue.localeCompare(aValue)
            }
        })
    }

    const sortedAttributes = getSortedAttributes();
    // Only highlight if search scope includes columns
    // Use internal search query first, or parent search if column scopes are enabled
    const highlightTerm = searchQuery ||
        (search && (searchScope.columnNames || searchScope.columnDescriptions || searchScope.columnDataTypes) ? search : "");

    // Notify parent of visible count changes
    useEffect(() => {
        onVisibleCountChange?.(sortedAttributes.length);
    }, [sortedAttributes.length, onVisibleCountChange]);

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) return <ArrowUpwardRounded className="ml-2 h-4 w-4" />
        if (sortDirection === 'asc') return <ArrowDownwardRounded className="ml-2 h-4 w-4" />
        if (sortDirection === 'desc') return <ArrowUpwardRounded className="ml-2 h-4 w-4" />
        return <ArrowDownwardRounded className="ml-2 h-4 w-4" />
    }

    const attributeTypes = [
        "all",
        "ChoiceAttribute",
        "DateTimeAttribute",
        "GenericAttribute",
        "IntegerAttribute",
        "LookupAttribute",
        "DecimalAttribute",
        "StringAttribute",
        "BooleanAttribute",
        "FileAttribute"
    ]

    return <>
        <Box
            className="p-1 md:p-2 gap-1 md:gap-2 border-b flex flex-col"
            sx={{
                borderColor: 'border.main',
                backgroundColor: 'background.paper'
            }}
        >
            <Box className="flex gap-1 md:gap-2 items-center">
                <TextField
                    size="small"
                    placeholder="Search attributes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setSearchQuery("")
                        }
                    }}
                    className="flex-grow"
                    sx={{
                        '& .MuiInputBase-input': {
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                        }
                    }}
                    slotProps={{
                        input: {
                            startAdornment: <InputAdornment position="start"><SearchRounded /></InputAdornment>,
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={() => setSearchQuery("")}
                                        title="Clear search"
                                        className="min-w-0 p-0"
                                    >
                                        <ClearRounded className="text-xs md:text-base" />
                                    </Button>
                                </InputAdornment>
                            )
                        }
                    }}
                />
                <FormControl size="small">
                    <InputLabel id="relationship-type-filter-label" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        Filter by type
                    </InputLabel>
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        label="Filter by type"
                        labelId="relationship-type-filter-label"
                        sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                    >
                        {attributeTypes.map(type => (
                            <MenuItem key={type} value={type} className="text-xs md:text-sm">
                                {type === "all" ? "All Types" : type.replace("Attribute", "")}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Tooltip title={hideStandardFields ? "Show unchanged columns" : "Hide unchanged columns"}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setHideStandardFields(!hideStandardFields)}
                        className="min-w-0 p-0 h-8 w-8 md:h-10 md:w-10"
                        sx={{
                            borderColor: 'border.main'
                        }}
                    >
                        {
                            hideStandardFields ? <VisibilityOff className="text-xs md:text-base" /> : <Visibility className="text-xs md:text-base" />
                        }
                    </Button>
                </Tooltip>
                {(searchQuery || typeFilter !== "all") && (
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                            setSearchQuery("")
                            setTypeFilter("all")
                        }}
                        title="Clear filters"
                        className="min-w-0 p-0 h-8 w-8 md:h-10 md:w-10"
                    >
                        <ClearRounded className="text-xs md:text-base" />
                    </Button>
                )}
            </Box>
            {search && search.length >= 3 && searchQuery && (
                <Box
                    className="flex items-center gap-1 text-xs md:text-sm px-1 py-0.5 rounded border"
                    sx={{
                        color: 'warning.dark',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 243, 224, 1)',
                        borderColor: 'warning.main'
                    }}
                >
                    <SearchRounded className="text-xs md:text-base" />
                    <Typography variant="body2" className="text-xs md:text-sm">
                        Warning: Global search &quot;{search}&quot; is also active
                    </Typography>
                </Box>
            )}
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
            {sortedAttributes.length === 0 ? (
                <Box className="p-4 text-center" sx={{ color: 'text.secondary' }}>
                    {searchQuery || typeFilter !== "all" ? (
                        <Box className="flex flex-col items-center gap-1">
                            <Typography variant="body2">
                                {searchQuery && typeFilter !== "all"
                                    ? `No ${typeFilter === "all" ? "" : typeFilter.replace("Attribute", "")} attributes found matching "${searchQuery}"`
                                    : searchQuery
                                        ? `No attributes found matching "${searchQuery}"`
                                        : `No ${typeFilter === "all" ? "" : typeFilter.replace("Attribute", "")} attributes available`
                                }
                            </Typography>
                            <Button
                                variant="text"
                                onClick={() => {
                                    setSearchQuery("")
                                    setTypeFilter("all")
                                }}
                                sx={{ color: 'primary.main' }}
                            >
                                Clear filters
                            </Button>
                        </Box>
                    ) : (
                        <Typography variant="body2">No attributes available for this table</Typography>
                    )}
                </Box>
            ) : (
                <Box
                    className="overflow-x-auto md:overflow-x-visible"
                    sx={{
                        borderTop: 1,
                        borderColor: 'border.main',
                        // Mobile: allow horizontal scrolling within the component
                        maxWidth: '100%',
                        '@media (max-width: 768px)': {
                            overflowX: 'auto',
                            '&::-webkit-scrollbar': {
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: 'rgba(0,0,0,0.1)',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                borderRadius: '4px',
                            },
                        }
                    }}
                >
                    <Table
                        className="w-full min-w-[800px] md:min-w-0"
                        sx={{
                            borderColor: 'border.main'
                        }}
                    >
                        <TableHead sx={{ backgroundColor: 'background.paper' }}>
                            <TableRow className="border-b-2" sx={{ borderColor: 'border.main' }}>
                                <TableCell
                                    className="w-[15%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('displayName')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Display Name
                                        <SortIcon column="displayName" />
                                    </Box>
                                </TableCell>
                                <TableCell
                                    className="w-[15%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('schemaName')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Schema Name
                                        <SortIcon column="schemaName" />
                                    </Box>
                                </TableCell>
                                <TableCell
                                    className="w-[30%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('type')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Type
                                        <SortIcon column="type" />
                                    </Box>
                                </TableCell>
                                <TableCell
                                    className="w-[5%] font-semibold py-1 md:py-1.5 text-xs md:text-sm"
                                    sx={{ color: 'text.primary' }}
                                >
                                    Details
                                </TableCell>
                                <TableCell
                                    className="w-[35%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('description')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Description
                                        <SortIcon column="description" />
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedAttributes.map((attribute, index) => (
                                <TableRow
                                    id={`attr-${entity.SchemaName}-${attribute.SchemaName}`}
                                    key={attribute.SchemaName}
                                    data-entity-schema={entity.SchemaName}
                                    data-attribute-schema={attribute.SchemaName}
                                    className="transition-colors duration-150 border-b"
                                    sx={{
                                        '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)' },
                                        borderColor: 'border.main',
                                        backgroundColor: index % 2 === 0
                                            ? 'background.paper'
                                            : theme.palette.mode === 'dark'
                                                ? 'rgba(255, 255, 255, 0.02)'
                                                : 'rgba(0, 0, 0, 0.02)'
                                    }}
                                >
                                    <TableCell className="break-words py-1 md:py-1.5 text-xs md:text-sm">
                                        {highlightMatch(attribute.DisplayName, highlightTerm)}
                                    </TableCell>
                                    <TableCell className="break-words py-1 md:py-1.5 text-xs md:text-sm">
                                        {highlightMatch(attribute.SchemaName, highlightTerm)}
                                    </TableCell>
                                    <TableCell className="break-words py-1 md:py-1.5">{getAttributeComponent(entity, attribute, highlightMatch, highlightTerm)}</TableCell>
                                    <TableCell className="py-1 md:py-1.5"><AttributeDetails entityName={entity.SchemaName} attribute={attribute} isEntityAuditEnabled={entity.IsAuditEnabled} /></TableCell>
                                    <TableCell className="break-words py-1 md:py-1.5 text-xs md:text-sm">
                                        {highlightMatch(attribute.Description ?? "", highlightTerm)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Box>
    </>
}

function getAttributeComponent(entity: EntityType, attribute: AttributeType, highlightMatch: (text: string, term: string) => string | React.JSX.Element, highlightTerm: string) {
    const key = `${attribute.SchemaName}-${entity.SchemaName}`;

    switch (attribute.AttributeType) {
        case 'ChoiceAttribute':
            return <ChoiceAttribute key={key} attribute={attribute} highlightMatch={highlightMatch} highlightTerm={highlightTerm} />;
        case 'DateTimeAttribute':
            return <DateTimeAttribute key={key} attribute={attribute} highlightMatch={highlightMatch} highlightTerm={highlightTerm} />;
        case 'GenericAttribute':
            return <GenericAttribute key={key} attribute={attribute} highlightMatch={highlightMatch} highlightTerm={highlightTerm} />;
        case 'IntegerAttribute':
            return <IntegerAttribute key={key} attribute={attribute} />;
        case 'LookupAttribute':
            return <LookupAttribute key={key} attribute={attribute} />;
        case 'DecimalAttribute':
            return <DecimalAttribute key={key} attribute={attribute} />;
        case 'StatusAttribute':
            return <StatusAttribute key={key} attribute={attribute} highlightMatch={highlightMatch} highlightTerm={highlightTerm} />;
        case 'StringAttribute':
            return <StringAttribute key={key} attribute={attribute} highlightMatch={highlightMatch} highlightTerm={highlightTerm} />;
        case 'BooleanAttribute':
            return <BooleanAttribute key={key} attribute={attribute} highlightMatch={highlightMatch} highlightTerm={highlightTerm} />;
        case 'FileAttribute':
            return <FileAttribute key={key} attribute={attribute} />;
        default:
            return null;
    }
}
