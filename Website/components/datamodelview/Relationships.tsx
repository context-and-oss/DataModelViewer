'use client'

import { EntityType } from "@/lib/Types"
import { CascadeConfiguration } from "./entity/CascadeConfiguration"
import { useState, useEffect } from "react"
import { useDatamodelView, useDatamodelViewDispatch } from "@/contexts/DatamodelViewContext"
import { useDatamodelData } from "@/contexts/DatamodelDataContext"
import React from "react"
import { highlightMatch } from "../datamodelview/List";
import { Button, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, InputAdornment, Box, Typography, useTheme, Tooltip, Chip } from "@mui/material"
import { SearchRounded, ClearRounded, ArrowUpwardRounded, ArrowDownwardRounded, Visibility, VisibilityOff, ContentPasteSearchRounded, ContentPasteOffRounded } from "@mui/icons-material"

type SortDirection = 'asc' | 'desc' | null
type SortColumn = 'name' | 'tableSchema' | 'lookupField' | 'type' | 'behavior' | 'schemaName' | null

interface IRelationshipsProps {
    entity: EntityType;
    search?: string;
    onVisibleCountChange?: (count: number) => void;
}

export const Relationships = ({ entity, search = "", onVisibleCountChange }: IRelationshipsProps) => {
    const [sortColumn, setSortColumn] = useState<SortColumn>("name")
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [hideImplicitRelationships, setHideImplicitRelationships] = useState<boolean>(true)
    const [hideOutOfSolutionRelationships, setHideOutOfSolutionRelationships] = useState<boolean>(true)

    const theme = useTheme();

    const dispatch = useDatamodelViewDispatch();
    const { scrollToSection } = useDatamodelView();
    const { groups, searchScope } = useDatamodelData();

    // Helper function to check if an entity is in the solution
    const isEntityInSolution = (entitySchemaName: string): boolean => {
        return groups.some(group =>
            group.Entities.some(e => e.SchemaName === entitySchemaName)
        );
    };

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

    const getSortedRelationships = () => {
        let filteredRelationships = entity.Relationships

        if (typeFilter !== "all") {
            filteredRelationships = filteredRelationships.filter(rel =>
                (typeFilter === "many-to-many" && rel.RelationshipType === "N:N") ||
                (typeFilter === "one-to-many" && rel.RelationshipType !== "N:N")
            )
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filteredRelationships = filteredRelationships.filter(rel =>
                rel.Name.toLowerCase().includes(query) ||
                rel.TableSchema.toLowerCase().includes(query) ||
                rel.LookupDisplayName.toLowerCase().includes(query) ||
                rel.RelationshipSchema.toLowerCase().includes(query)
            )
        }

        // Also filter by parent search prop if provided
        if (search && search.length >= 3) {
            const query = search.toLowerCase()
            filteredRelationships = filteredRelationships.filter(rel =>
                rel.Name.toLowerCase().includes(query) ||
                rel.TableSchema.toLowerCase().includes(query) ||
                rel.LookupDisplayName.toLowerCase().includes(query) ||
                rel.RelationshipSchema.toLowerCase().includes(query)
            )
        }

        filteredRelationships = filteredRelationships.filter(rel => rel.IsExplicit || !hideImplicitRelationships);

        // Filter out relationships where related table is not in solution
        if (hideOutOfSolutionRelationships) {
            filteredRelationships = filteredRelationships.filter(rel => isEntityInSolution(rel.TableSchema));
        }

        if (!sortColumn || !sortDirection) return filteredRelationships

        return [...filteredRelationships].sort((a, b) => {
            let aValue = ''
            let bValue = ''

            switch (sortColumn) {
                case 'name':
                    aValue = a.Name
                    bValue = b.Name
                    break
                case 'tableSchema':
                    aValue = a.TableSchema
                    bValue = b.TableSchema
                    break
                case 'lookupField':
                    aValue = a.LookupDisplayName
                    bValue = b.LookupDisplayName
                    break
                case 'type':
                    aValue = a.RelationshipType
                    bValue = b.RelationshipType
                    break
                case 'schemaName':
                    aValue = a.RelationshipSchema
                    bValue = b.RelationshipSchema
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

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) return <ArrowUpwardRounded className="ml-2 h-4 w-4" />
        if (sortDirection === 'asc') return <ArrowDownwardRounded className="ml-2 h-4 w-4" />
        if (sortDirection === 'desc') return <ArrowUpwardRounded className="ml-2 h-4 w-4" />
        return <ArrowDownwardRounded className="ml-2 h-4 w-4" />
    }

    const relationshipTypes = [
        { value: "all", label: "All Types" },
        { value: "many-to-many", label: "Many-to-Many" },
        { value: "one-to-many", label: "One-to-Many" }
    ]

    const sortedRelationships = getSortedRelationships();
    // Only highlight if search scope includes relationships
    // Use internal search query first, or parent search if relationships scope is enabled
    const highlightTerm = searchQuery ||
        (search && searchScope.relationships ? search : "");

    // Notify parent of visible count changes
    useEffect(() => {
        onVisibleCountChange?.(sortedRelationships.length);
    }, [sortedRelationships.length, onVisibleCountChange]);

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
                    placeholder="Search relationships..."
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
                        {relationshipTypes.map(type => (
                            <MenuItem key={type.value} value={type.value} className="text-xs md:text-sm">
                                {type.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Tooltip title={hideImplicitRelationships ? "Show implicitly added relationships (often lookups)" : "Hide implicitly added relationships"}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setHideImplicitRelationships(!hideImplicitRelationships)}
                        className="min-w-0 p-0 h-8 w-8 md:h-10 md:w-10"
                        sx={{
                            borderColor: 'border.main'
                        }}
                    >
                        {
                            hideImplicitRelationships ? <VisibilityOff className="text-xs md:text-base" /> : <Visibility className="text-xs md:text-base" />
                        }
                    </Button>
                </Tooltip>
                <Tooltip title={hideOutOfSolutionRelationships ? "Show relationships to tables not in solution" : "Hide relationships to tables not in solution"}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setHideOutOfSolutionRelationships(!hideOutOfSolutionRelationships)}
                        className="min-w-0 p-0 h-8 w-8 md:h-10 md:w-10"
                        sx={{
                            borderColor: 'border.main'
                        }}
                    >
                        {
                            hideOutOfSolutionRelationships ? <ContentPasteOffRounded className="text-xs md:text-base" /> : <ContentPasteSearchRounded className="text-xs md:text-base" />
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
        <Box className="overflow-x-auto">
            {getSortedRelationships().length === 0 ? (
                <Box className="p-4 text-center" sx={{ color: 'text.secondary' }}>
                    {searchQuery || typeFilter !== "all" ? (
                        <Box className="flex flex-col items-center gap-1">
                            <Typography variant="body2" className="text-xs md:text-sm">
                                {searchQuery && typeFilter !== "all"
                                    ? `No ${typeFilter === "many-to-many" ? "many-to-many" : "one-to-many"} relationships found matching "${searchQuery}"`
                                    : searchQuery
                                        ? `No relationships found matching "${searchQuery}"`
                                        : `No ${typeFilter === "many-to-many" ? "many-to-many" : "one-to-many"} relationships available`
                                }
                            </Typography>
                            <Button
                                variant="text"
                                onClick={() => {
                                    setSearchQuery("")
                                    setTypeFilter("all")
                                }}
                                className="text-xs md:text-sm"
                                sx={{ color: 'primary.main' }}
                            >
                                Clear filters
                            </Button>
                        </Box>
                    ) : (
                        <Typography variant="body2" className="text-xs md:text-sm">No relationships available for this table</Typography>
                    )}
                </Box>
            ) : (
                <Box
                    className="border-t max-w-full overflow-x-auto md:overflow-x-visible"
                    sx={{
                        borderColor: 'border.main',
                        '@media (max-width: 768px)': {
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
                        className="w-full min-w-[900px] md:min-w-0"
                        sx={{ borderColor: 'border.main' }}
                    >
                        <TableHead sx={{ backgroundColor: 'background.paper' }}>
                            <TableRow className="border-b-2" sx={{ borderColor: 'border.main' }}>
                                <TableCell
                                    className="w-[15%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('name')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Name
                                        <SortIcon column="name" />
                                    </Box>
                                </TableCell>
                                <TableCell
                                    className="w-[15%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('tableSchema')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Related Table
                                        <SortIcon column="tableSchema" />
                                    </Box>
                                </TableCell>
                                <TableCell
                                    className="w-[15%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('lookupField')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Lookup Field
                                        <SortIcon column="lookupField" />
                                    </Box>
                                </TableCell>
                                <TableCell
                                    className="w-[10%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('type')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Type
                                        <SortIcon column="type" />
                                    </Box>
                                </TableCell>
                                <TableCell
                                    className="w-[25%] font-semibold py-1 md:py-1.5 text-xs md:text-sm"
                                    sx={{ color: 'text.primary' }}
                                >
                                    Behavior
                                </TableCell>
                                <TableCell
                                    className="w-[20%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('schemaName')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Schema Name
                                        <SortIcon column="schemaName" />
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedRelationships.map((relationship, index) =>
                                <TableRow
                                    key={relationship.RelationshipSchema}
                                    id={`rel-${entity.SchemaName}-${relationship.RelationshipSchema}`}
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
                                        {relationship.Name}
                                    </TableCell>
                                    <TableCell className="py-1 md:py-1.5">
                                        {isEntityInSolution(relationship.TableSchema) ? (
                                            <Button
                                                key={relationship.TableSchema}
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ContentPasteSearchRounded className="w-2 h-2 md:w-3 md:h-3" />}
                                                onClick={() => {
                                                    dispatch({ type: 'SET_LOADING_SECTION', payload: relationship.TableSchema });
                                                    dispatch({ type: "SET_CURRENT_SECTION", payload: relationship.TableSchema });
                                                    scrollToSection(relationship.TableSchema, true);
                                                }}
                                                sx={{
                                                    fontSize: { xs: '0.625rem', md: '0.875rem' },
                                                    height: { xs: '16px', md: '24px' },
                                                    minWidth: 'auto',
                                                    px: { xs: 0.75, md: 1 },
                                                    '& .MuiButton-startIcon': {
                                                        marginLeft: 0,
                                                        marginRight: { xs: '2px', md: '4px' }
                                                    }
                                                }}
                                            >
                                                {relationship.TableSchema}
                                            </Button>
                                        ) : (
                                            <Chip
                                                key={relationship.TableSchema}
                                                icon={<ContentPasteOffRounded className="w-2 h-2 md:w-3 md:h-3" />}
                                                label={relationship.TableSchema}
                                                size="small"
                                                disabled
                                                sx={{
                                                    fontSize: { xs: '0.625rem', md: '0.875rem' },
                                                    height: { xs: '16px', md: '24px' },
                                                    backgroundColor: 'grey.100',
                                                    color: 'grey.600',
                                                    '& .MuiChip-icon': {
                                                        fontSize: { xs: '0.5rem', md: '0.75rem' }
                                                    }
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="break-words py-1 md:py-1.5 text-xs md:text-sm">
                                        {highlightMatch(relationship.LookupDisplayName, highlightTerm)}
                                    </TableCell>
                                    <TableCell className="py-1 md:py-1.5 text-xs md:text-sm">
                                        {relationship.RelationshipType}
                                    </TableCell>
                                    <TableCell className="py-1 md:py-1.5">
                                        <CascadeConfiguration config={relationship.CascadeConfiguration} />
                                    </TableCell>
                                    <TableCell className="break-words py-1 md:py-1.5 text-xs md:text-sm">
                                        {highlightMatch(relationship.RelationshipSchema, highlightTerm)}
                                        {relationship.IntersectEntitySchemaName &&
                                            (<Typography variant="body2" className="text-xs md:text-sm text-secondary"><b>Intersecting table:</b> {relationship.IntersectEntitySchemaName}</Typography>)}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Box>
    </>
}