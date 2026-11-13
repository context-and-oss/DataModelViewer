'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatamodelData } from '@/contexts/DatamodelDataContext';
import { useEntityFilters, useEntityFiltersDispatch } from '@/contexts/EntityFiltersContext';
import { Box, Chip, CircularProgress, Divider, FormControl, IconButton, InputAdornment, InputBase, InputLabel, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, OutlinedInput, Paper, Select, SelectChangeEvent, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { AbcRounded, AccountTreeRounded, AlignHorizontalLeftRounded, ClearRounded, ExpandMoreRounded, FormatListBulletedRounded, InfoRounded, KeyboardArrowDownRounded, KeyboardArrowUpRounded, NavigateBeforeRounded, NavigateNextRounded, NotesRounded, RestartAltRounded, SearchRounded } from '@mui/icons-material';

export const SEARCH_SCOPE_KEYS = {
  COLUMN_NAMES: 'columnNames',
  COLUMN_DESCRIPTIONS: 'columnDescriptions',
  COLUMN_DATA_TYPES: 'columnDataTypes',
  TABLE_DESCRIPTIONS: 'tableDescriptions',
  RELATIONSHIPS: 'relationships',
} as const;

export type SearchScopeKey = typeof SEARCH_SCOPE_KEYS[keyof typeof SEARCH_SCOPE_KEYS];

export interface SearchScope {
  columnNames: boolean;
  columnDescriptions: boolean;
  columnDataTypes: boolean;
  tableDescriptions: boolean;
  relationships: boolean;
}

interface TimeSlicedSearchProps {
  onSearch: (value: string) => void;
  onLoadingChange: (loading: boolean) => void;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  initialLocalValue: string;
  currentIndex?: number;
  totalResults?: number;
  placeholder?: string;
  onSearchScopeChange?: (scope: SearchScope) => void;
}

const DEFAULT_SEARCH_SCOPE: SearchScope = {
  columnNames: true,
  columnDescriptions: true,
  columnDataTypes: false,
  tableDescriptions: false,
  relationships: false,
};

// Time-sliced input that maintains 60fps regardless of background work
export const TimeSlicedSearch = ({
  onSearch,
  onLoadingChange,
  onNavigateNext,
  onNavigatePrevious,
  initialLocalValue,
  currentIndex,
  totalResults,
  placeholder = "Search columns...",
  onSearchScopeChange,
}: TimeSlicedSearchProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [localValue, setLocalValue] = useState(initialLocalValue);
  const [isTyping, setIsTyping] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [lastValidSearch, setLastValidSearch] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>(() => {
    // Initialize from URL params if available
    const scopeParam = searchParams.get('scope');
    if (scopeParam) {
      try {
        const scopes = scopeParam.split(',');
        return {
          columnNames: scopes.includes('cn'),
          columnDescriptions: scopes.includes('cd'),
          columnDataTypes: scopes.includes('cdt'),
          tableDescriptions: scopes.includes('td'),
          relationships: scopes.includes('rel'),
        };
      } catch {
        return DEFAULT_SEARCH_SCOPE;
      }
    }
    return DEFAULT_SEARCH_SCOPE;
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { isOpen } = useSidebar();
  const { isSettingsOpen } = useSettings();
  const isMobile = useIsMobile();
  const { groups } = useDatamodelData();
  const { selectedSecurityRoles } = useEntityFilters();
  const entityFiltersDispatch = useEntityFiltersDispatch();

  // Collect all unique security roles across all entities
  const availableRoles = useMemo(() => {
    if (!groups) return [];

    const roleSet = new Set<string>();

    for (const group of groups) {
      for (const entity of group.Entities) {
        if (entity.SecurityRoles) {
          for (const role of entity.SecurityRoles) {
            roleSet.add(role.Name);
          }
        }
      }
    }

    return Array.from(roleSet).sort((a, b) => a.localeCompare(b));
  }, [groups]);

  const searchTimeoutRef = useRef<number>();
  const typingTimeoutRef = useRef<number>();
  const frameRef = useRef<number>();
  const paperRef = useRef<HTMLFormElement>(null);

  // Hide search on mobile when sidebar is open, or when settings are open
  const shouldHideSearch = (isMobile && isOpen) || isSettingsOpen;

  // Initialize security roles from URL params on mount
  useEffect(() => {
    const rolesParam = searchParams.get('roles');
    if (rolesParam) {
      try {
        const roles = rolesParam.split(',').filter(Boolean);
        entityFiltersDispatch({ type: 'SET_SECURITY_ROLES', roles });
      } catch {
        // Ignore invalid param
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL params when search scope or security roles change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Update scope param
    const scopeKeys: string[] = [];
    if (searchScope.columnNames) scopeKeys.push('cn');
    if (searchScope.columnDescriptions) scopeKeys.push('cd');
    if (searchScope.columnDataTypes) scopeKeys.push('cdt');
    if (searchScope.tableDescriptions) scopeKeys.push('td');
    if (searchScope.relationships) scopeKeys.push('rel');

    if (scopeKeys.length > 0 && JSON.stringify(searchScope) !== JSON.stringify(DEFAULT_SEARCH_SCOPE)) {
      params.set('scope', scopeKeys.join(','));
    } else {
      params.delete('scope');
    }

    // Update roles param
    if (selectedSecurityRoles.length > 0) {
      params.set('roles', selectedSecurityRoles.join(','));
    } else {
      params.delete('roles');
    }

    // Build URL, preserving existing params like 'globalsearch'
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    // Only update if the URL actually changed to avoid infinite loops
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [searchScope, selectedSecurityRoles, pathname, router, searchParams]);

  // Notify parent when search scope changes
  useEffect(() => {
    onSearchScopeChange?.(searchScope);
  }, [searchScope, onSearchScopeChange]);

  // Convert searchScope to array format for ToggleButtonGroup
  const scopeToArray = useCallback((scope: SearchScope): SearchScopeKey[] => {
    const result: SearchScopeKey[] = [];
    if (scope.columnNames) result.push(SEARCH_SCOPE_KEYS.COLUMN_NAMES);
    if (scope.columnDescriptions) result.push(SEARCH_SCOPE_KEYS.COLUMN_DESCRIPTIONS);
    if (scope.columnDataTypes) result.push(SEARCH_SCOPE_KEYS.COLUMN_DATA_TYPES);
    if (scope.tableDescriptions) result.push(SEARCH_SCOPE_KEYS.TABLE_DESCRIPTIONS);
    if (scope.relationships) result.push(SEARCH_SCOPE_KEYS.RELATIONSHIPS);
    return result;
  }, []);

  // Convert array format back to searchScope
  const arrayToScope = useCallback((arr: SearchScopeKey[]): SearchScope => {
    return {
      columnNames: arr.includes(SEARCH_SCOPE_KEYS.COLUMN_NAMES),
      columnDescriptions: arr.includes(SEARCH_SCOPE_KEYS.COLUMN_DESCRIPTIONS),
      columnDataTypes: arr.includes(SEARCH_SCOPE_KEYS.COLUMN_DATA_TYPES),
      tableDescriptions: arr.includes(SEARCH_SCOPE_KEYS.TABLE_DESCRIPTIONS),
      relationships: arr.includes(SEARCH_SCOPE_KEYS.RELATIONSHIPS),
    };
  }, []);

  // Handle toggle button group changes
  const handleScopeChange = useCallback((
    _event: React.MouseEvent<HTMLElement>,
    newScopes: SearchScopeKey[],
  ) => {
    if (newScopes.length > 0) { // Ensure at least one scope is selected
      setSearchScope(arrayToScope(newScopes));
    }
  }, [arrayToScope]);

  const resetScope = useCallback(() => {
    setSearchScope(DEFAULT_SEARCH_SCOPE);
  }, []);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  const handleSecurityRoleChange = useCallback((event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    entityFiltersDispatch({ type: 'SET_SECURITY_ROLES', roles: typeof value === 'string' ? value.split(',') : value });
  }, [entityFiltersDispatch]);

  const handleDeleteSecurityRole = useCallback((roleToDelete: string) => () => {
    entityFiltersDispatch({ type: 'SET_SECURITY_ROLES', roles: selectedSecurityRoles.filter(role => role !== roleToDelete) });
  }, [selectedSecurityRoles, entityFiltersDispatch]);

  const handleClearSecurityRoles = useCallback(() => {
    entityFiltersDispatch({ type: 'SET_SECURITY_ROLES', roles: [] });
  }, [entityFiltersDispatch]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (localValue.length === 0) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setLocalValue('');
        onSearch(''); // Only clear when explicitly using ESC
        setIsTyping(false);
        onLoadingChange(false);
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onNavigateNext?.();
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        onNavigatePrevious?.();
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      } else if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault();
        onNavigateNext?.();
      } else if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        onNavigatePrevious?.();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [localValue, onSearch, onLoadingChange, onNavigateNext, onNavigatePrevious]);

  // Time-sliced debouncing using requestAnimationFrame
  const scheduleSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If we're going from a valid search to an invalid one, clear the search
    if (value.length < 3 && lastValidSearch.length >= 3) {
      onSearch('');
      setLastValidSearch('');
      setIsTyping(false);
      onLoadingChange(false);
      return;
    }

    // Don't search if less than 3 characters
    if (value.length < 3) {
      setIsTyping(false);
      onLoadingChange(false);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      // Use MessageChannel for immediate callback without blocking main thread
      const channel = new MessageChannel();
      channel.port2.onmessage = () => {
        onSearch(value);
        setLastValidSearch(value);

        // Reset typing state in next frame
        frameRef.current = requestAnimationFrame(() => {
          setIsTyping(false);
        });
      };
      channel.port1.postMessage(null);
    }, 350);
  }, [onSearch, onLoadingChange, lastValidSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Immediate visual update (highest priority)
    setLocalValue(value);

    // Only manage typing state and loading for searches >= 3 characters
    if (value.length >= 3) {
      // Manage typing state
      if (!isTyping) {
        setIsTyping(true);
        onLoadingChange(true);
      }

      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-reset typing state if user stops typing
      typingTimeoutRef.current = window.setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    } else {
      // Clear typing state for short searches
      setIsTyping(false);
      onLoadingChange(false);

      // Clear any pending timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Schedule search (will handle short searches internally)
    scheduleSearch(value);

  }, [isTyping, onLoadingChange, scheduleSearch]);

  // Handle clear button
  const handleClear = useCallback(() => {
    if (localValue.length === 0) return; // No-op if already empty
    handleClose();
    setLocalValue('');
    onSearch(''); // Clear search immediately
    setIsTyping(false);
    onLoadingChange(false);

    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [onSearch, onLoadingChange, localValue]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Portal setup
  useEffect(() => {
    let container = document.getElementById('time-sliced-search-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'time-sliced-search-portal';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }

    const searchContainer = document.createElement('div');
    searchContainer.style.pointerEvents = 'auto';
    container.appendChild(searchContainer);
    setPortalRoot(searchContainer);

    return () => {
      if (searchContainer && container?.contains(searchContainer)) {
        container.removeChild(searchContainer);
      }
    };
  }, []);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (open) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Close menu when focus moves back to search input or elsewhere
  const handleSearchFocus = () => {
    if (open) {
      setAnchorEl(null);
    }
  };

  const searchInput = (
    <Box className={`fixed flex flex-col gap-2 top-20 md:top-24 m-auto w-full items-center md:items-end md:right-4 z-50 transition-opacity bg-transparent duration-200 pointer-events-none ${shouldHideSearch ? 'opacity-0' : 'opacity-100'}`}>
      <Paper
        ref={paperRef}
        component="form"
        className={`rounded-lg w-[320px] ${shouldHideSearch ? 'pointer-events-none' : 'pointer-events-auto'}`}
        sx={{ backgroundColor: 'background.paper' }}
      >
        {/* Main Search Bar */}
        <Box className='p-1 flex items-center'>
          <InputAdornment position="start" className='ml-1'>
            <SearchRounded color="action" />
          </InputAdornment>

          <Divider orientation="vertical" className='mr-1 h-6' />

          <InputBase
            className='ml-1 flex-1'
            type="text"
            placeholder={placeholder}
            aria-label="Search columns in tables"
            value={localValue}
            onChange={handleChange}
            onFocus={handleSearchFocus}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            sx={{ backgroundColor: 'transparent' }}
          />

          <InputAdornment position="end">
            {isTyping && localValue.length >= 3 ? (
              <CircularProgress size={20} />
            ) : localValue && totalResults !== undefined && totalResults > 0 ? (
              <Typography
                variant='caption'
                color="text.secondary"
                className='px-2 font-mono'
                sx={{ minWidth: '40px', textAlign: 'center' }}
              >
                {currentIndex}/{totalResults}
              </Typography>
            ) : null}
          </InputAdornment>

          <Divider orientation="vertical" className='mx-1 h-6' />

          <Tooltip title="Advanced search options" PopperProps={{ sx: { zIndex: 10001 } }}>
            <IconButton
              onClick={toggleAdvanced}
              size="small"
              sx={{
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <ExpandMoreRounded fontSize="small" color="action" />
            </IconButton>
          </Tooltip>

          <IconButton onClick={handleClick} size="small">
            <InfoRounded fontSize="small" color="action" />
          </IconButton>
        </Box>

        {/* Advanced Search Section */}
        {showAdvanced && (
          <>
            <Divider />
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                padding: '8px',
                gap: 0.5,
              }}
            >
              <ToggleButtonGroup
                size="small"
                className='w-full'
                value={scopeToArray(searchScope)}
                onChange={handleScopeChange}
                aria-label="search scope"
                sx={{
                  flex: 1,
                }}
              >
                <ToggleButton value={SEARCH_SCOPE_KEYS.COLUMN_NAMES} aria-label="column names">
                  <Tooltip title="Search in column names" slotProps={{ popper: { sx: { zIndex: 10001 } } }}>
                    <AbcRounded fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value={SEARCH_SCOPE_KEYS.COLUMN_DESCRIPTIONS} aria-label="column descriptions">
                  <Tooltip title="Search in column descriptions" slotProps={{ popper: { sx: { zIndex: 10001 } } }}>
                    <NotesRounded fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value={SEARCH_SCOPE_KEYS.COLUMN_DATA_TYPES} aria-label="column data types">
                  <Tooltip title="Search in column data types" slotProps={{ popper: { sx: { zIndex: 10001 } } }}>
                    <FormatListBulletedRounded fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value={SEARCH_SCOPE_KEYS.TABLE_DESCRIPTIONS} aria-label="table descriptions">
                  <Tooltip title="Search in table descriptions" slotProps={{ popper: { sx: { zIndex: 10001 } } }}>
                    <AlignHorizontalLeftRounded fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value={SEARCH_SCOPE_KEYS.RELATIONSHIPS} aria-label="relationships">
                  <Tooltip title="Search in relationship names" slotProps={{ popper: { sx: { zIndex: 10001 } } }}>
                    <AccountTreeRounded fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Reset to default search scope" PopperProps={{ sx: { zIndex: 10001 } }}>
                <IconButton size="small" onClick={resetScope} aria-label="reset scope" sx={{ width: 36, height: 36 }}>
                  <RestartAltRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}

        {/* Security Role Impersonation */}
        {showAdvanced && availableRoles.length > 0 && (
          <>
            <Divider />
            <Box className="p-2 flex items-center gap-1">
              <FormControl size="small" className="flex-1">
                <InputLabel id="security-role-selector-label">Security Role Impersonation</InputLabel>
                <Select
                  labelId="security-role-selector-label"
                  id="security-role-selector"
                  multiple
                  fullWidth
                  className="mt-1"
                  value={selectedSecurityRoles}
                  onChange={handleSecurityRoleChange}
                  input={<OutlinedInput label="Security Role Impersonation" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          onDelete={handleDeleteSecurityRole(value)}
                          onMouseDown={(event) => {
                            event.stopPropagation();
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        width: 'inherit',
                        maxWidth: 'inherit',
                        maxHeight: 300,
                      },
                      sx: {
                        zIndex: 10000, // Higher than portal root z-index
                        width: 'inherit',
                      }
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    sx: {
                      zIndex: 10000, // Higher z-index for the menu itself
                    },
                  }}
                >
                  {availableRoles.map((role) => (
                    <MenuItem
                      key={role}
                      value={role}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Tooltip title={role} placement="right" PopperProps={{ sx: { zIndex: 10002 } }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {role}
                        </span>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedSecurityRoles.length > 0 && (
                <Tooltip title="Clear all selected roles" PopperProps={{ sx: { zIndex: 10001 } }}>
                  <IconButton size="small" onClick={handleClearSecurityRoles} sx={{ width: 36, height: 36 }}>
                    <ClearRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </>
        )}
      </Paper>

      <Menu
        anchorEl={paperRef.current}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          mt: 1,
        }}
      >
        <MenuList dense className='w-64'>
          <MenuItem disabled={localValue.length < 3} onClick={onNavigateNext}>
            <ListItemIcon>
              <NavigateNextRounded />
            </ListItemIcon>
            <ListItemText>Next</ListItemText>
            <Typography variant='body2' color="text.secondary">Enter</Typography>
          </MenuItem>
          <MenuItem disabled={localValue.length < 3} onClick={onNavigatePrevious}>
            <ListItemIcon>
              <NavigateBeforeRounded />
            </ListItemIcon>
            <ListItemText>Previous</ListItemText>
            <Typography variant='body2' color="text.secondary">Shift + Enter</Typography>
          </MenuItem>
          <MenuItem disabled={localValue.length < 3} onClick={onNavigateNext}>
            <ListItemIcon>
              <NavigateNextRounded />
            </ListItemIcon>
            <ListItemText>Next</ListItemText>
            <Typography variant='body2' color="text.secondary">Ctrl + <KeyboardArrowDownRounded /></Typography>
          </MenuItem>
          <MenuItem disabled={localValue.length < 3} onClick={onNavigatePrevious}>
            <ListItemIcon>
              <NavigateBeforeRounded />
            </ListItemIcon>
            <ListItemText>Previous</ListItemText>
            <Typography variant='body2' color="text.secondary">Ctrl + <KeyboardArrowUpRounded /></Typography>
          </MenuItem>
          <Divider />
          <MenuItem disabled={localValue.length === 0} onClick={handleClear}>
            <ListItemIcon>
              <ClearRounded />
            </ListItemIcon>
            <ListItemText>Clear</ListItemText>
            <Typography variant='body2' color="text.secondary">Esc</Typography>
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );

  return portalRoot ? createPortal(searchInput, portalRoot) : null;
};
