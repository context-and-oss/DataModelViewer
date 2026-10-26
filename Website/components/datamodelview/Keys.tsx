'use client'

import { EntityType } from "@/lib/Types"
import { useState } from "react"
import React from "react"
import { highlightMatch } from "../datamodelview/List";
import { 
    Button, 
    TextField, 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableRow, 
    Box, 
    Typography, 
    Alert, 
    Chip,
    InputAdornment,
    useTheme
} from "@mui/material"
import { ArrowDownwardRounded, ArrowUpwardRounded, CloseRounded, SearchRounded } from "@mui/icons-material";

type SortColumn = 'name' | 'logicalName' | 'attributes' | null
type SortDirection = 'asc' | 'desc' | null

interface IKeysProps {
    entity: EntityType;
    search?: string;
}

function Keys({ entity, search = "" }: IKeysProps) {
    const [sortColumn, setSortColumn] = useState<SortColumn>("name")
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
    const [searchQuery, setSearchQuery] = useState("")
    const theme = useTheme()

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

    const getSortedKeys = () => {
        let filteredKeys = entity.Keys

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filteredKeys = filteredKeys.filter(key => 
                key.Name.toLowerCase().includes(query) ||
                key.LogicalName.toLowerCase().includes(query) ||
                key.KeyAttributes.some(attr => attr.toLowerCase().includes(query))
            )
        }

        // Also filter by parent search prop if provided
        if (search && search.length >= 3) {
            const query = search.toLowerCase()
            filteredKeys = filteredKeys.filter(key => 
                key.Name.toLowerCase().includes(query) ||
                key.LogicalName.toLowerCase().includes(query) ||
                key.KeyAttributes.some(attr => attr.toLowerCase().includes(query))
            )
        }

        if (!sortColumn || !sortDirection) return filteredKeys

        return [...filteredKeys].sort((a, b) => {
            let aValue = ''
            let bValue = ''

            switch (sortColumn) {
                case 'name':
                    aValue = a.Name
                    bValue = b.Name
                    break
                case 'logicalName':
                    aValue = a.LogicalName
                    bValue = b.LogicalName
                    break
                case 'attributes':
                    aValue = a.KeyAttributes.join(', ')
                    bValue = b.KeyAttributes.join(', ')
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

    const sortedKeys = getSortedKeys();
    const highlightTerm = searchQuery || search; // Use internal search or parent search for highlighting

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) return <ArrowDownwardRounded className="ml-2 h-4 w-4" />
        if (sortDirection === 'asc') return <ArrowUpwardRounded className="ml-2 h-4 w-4" />
        if (sortDirection === 'desc') return <ArrowDownwardRounded className="ml-2 h-4 w-4" />
        return <ArrowUpwardRounded className="ml-2 h-4 w-4" />
    }

    return (
        <>
            <Box 
                className="flex flex-col gap-1 md:gap-2 p-1 md:p-2 border-b"
                sx={{ borderColor: 'border.main' }}
            >
                <Box className="flex items-center gap-1 md:gap-2">
                    <TextField
                        placeholder="Search keys..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setSearchQuery("")
                            }
                        }}
                        size="small"
                        className="flex-grow"
                        sx={{ 
                            '& .MuiInputBase-input': {
                                fontSize: { xs: '0.75rem', md: '0.875rem' },
                                py: { xs: 0.5, md: 1 }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRounded className="h-3 w-3 md:h-4 md:w-4" style={{ color: theme.palette.text.secondary }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <Button
                                        onClick={() => setSearchQuery("")}
                                        size="small"
                                        className="min-w-0 p-1"
                                        sx={{ 
                                            color: 'text.secondary',
                                            '&:hover': { color: 'text.primary' }
                                        }}
                                        title="Clear search"
                                    >
                                        <CloseRounded className="h-3 w-3 md:h-4 md:w-4" />
                                    </Button>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>
                {search && search.length >= 3 && searchQuery && (
                    <Alert 
                        severity="warning" 
                        className="py-1 text-xs md:text-sm"
                        sx={{ 
                            '& .MuiAlert-icon': {
                                fontSize: { xs: '0.875rem', md: '1rem' }
                            }
                        }}
                    >
                        Warning: Global search &quot;{search}&quot; is also active
                    </Alert>
                )}
            </Box>
            <Box className="overflow-x-auto">
                {sortedKeys.length === 0 ? (
                    <Box className="p-4 text-center" sx={{ color: 'text.secondary' }}>
                        {searchQuery ? (
                            <Box className="flex flex-col items-center gap-1">
                                <Typography variant="body2" className="text-xs md:text-sm">
                                    No keys found matching &quot;{searchQuery}&quot;
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => setSearchQuery("")}
                                    className="text-xs md:text-sm"
                                    sx={{ color: 'primary.main' }}
                                >
                                    Clear search
                                </Button>
                            </Box>
                        ) : (
                            <Typography variant="body2" className="text-xs md:text-sm">No keys available for this table</Typography>
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
                            className="w-full min-w-[700px] md:min-w-0"
                            sx={{ borderColor: 'border.main' }}
                        >
                        <TableHead sx={{ backgroundColor: 'background.paper' }}>
                            <TableRow className="border-b-2" sx={{ borderColor: 'border.main' }}>
                                <TableCell 
                                    className="w-[25%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('name')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Name
                                        <SortIcon column="name" />
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    className="w-[25%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('logicalName')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Logical Name
                                        <SortIcon column="logicalName" />
                                    </Box>
                                </TableCell>
                                <TableCell 
                                    className="w-[50%] font-semibold py-1 md:py-1.5 text-xs md:text-sm cursor-pointer"
                                    onClick={() => handleSort('attributes')}
                                    sx={{ color: 'text.primary' }}
                                >
                                    <Box className="flex items-center">
                                        Key Columns
                                        <SortIcon column="attributes" />
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedKeys.map((key, index) => (
                                <TableRow 
                                    key={key.LogicalName}
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
                                    <TableCell className="break-words font-medium py-1 md:py-1.5 text-xs md:text-sm">
                                        {highlightMatch(key.Name, highlightTerm)}
                                    </TableCell>
                                    <TableCell 
                                        className="break-words py-1 md:py-1.5 text-xs md:text-sm"
                                        sx={{ color: 'text.secondary' }}
                                    >
                                        {highlightMatch(key.LogicalName, highlightTerm)}
                                    </TableCell>
                                    <TableCell className="break-words py-1 md:py-1.5">
                                        <Box className="flex flex-wrap gap-1">
                                            {key.KeyAttributes.map((attr, i) => (
                                                <Chip 
                                                    key={i}
                                                    label={highlightMatch(attr, highlightTerm)}
                                                    size="small"
                                                    variant="outlined"
                                                    className="text-xs md:text-sm h-5 md:h-6"
                                                    sx={{
                                                        backgroundColor: theme.palette.mode === 'dark' 
                                                            ? 'rgba(25, 118, 210, 0.12)' 
                                                            : 'rgba(25, 118, 210, 0.08)',
                                                        color: 'primary.main',
                                                        borderColor: 'primary.main',
                                                        '& .MuiChip-label': {
                                                            px: { xs: 0.5, md: 1 },
                                                            fontSize: { xs: '0.65rem', md: '0.75rem' }
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </Box>
                )}
            </Box>
        </>
    )
}

export default Keys 