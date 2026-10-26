"use client"

import { DatamodelView } from "@/components/datamodelview/DatamodelView";
import { useSearchParams } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useReducer, useRef } from "react";

export interface DatamodelViewState {
    currentGroup: string | null;
    currentSection: string | null;
    scrollToSection: (sectionId: string, revealIfFiltered?: boolean) => void;
    scrollToGroup: (groupName: string) => void;
    scrollToAttribute: (sectionId: string, attrSchema: string) => void;
    scrollToRelationship: (sectionId: string, relSchema: string) => void;
    loading: boolean;
    loadingSection: string | null;
    restoreSection: () => void;
}

const initialState: DatamodelViewState = {
    currentGroup: null,
    currentSection: null,
    scrollToSection: () => { throw new Error("scrollToSection not initialized yet!"); },
    scrollToGroup: () => { throw new Error("scrollToGroup not initialized yet!"); },
    scrollToAttribute: () => { throw new Error("scrollToAttribute not initialized yet!"); },
    scrollToRelationship: () => { throw new Error("scrollToRelationship not initialized yet!"); },
    loading: true,
    loadingSection: null,
    restoreSection: () => { throw new Error("restoreSection not initialized yet!"); },
}

type DatamodelViewAction =
    | { type: 'SET_CURRENT_GROUP', payload: string | null }
    | { type: 'SET_CURRENT_SECTION', payload: string | null }
    | { type: 'SET_SCROLL_TO_SECTION', payload: (sectionId: string, revealIfFiltered?: boolean) => void }
    | { type: 'SET_SCROLL_TO_GROUP', payload: (groupName: string) => void }
    | { type: 'SET_LOADING', payload: boolean }
    | { type: 'SET_LOADING_SECTION', payload: string | null }
    | { type: 'SET_RESTORE_SECTION', payload: () => void }
    | { type: 'SET_SCROLL_TO_ATTRIBUTE', payload: (sectionId: string, attrSchema: string) => void }
    | { type: 'SET_SCROLL_TO_RELATIONSHIP', payload: (sectionId: string, relSchema: string) => void };


const datamodelViewReducer = (state: DatamodelViewState, action: DatamodelViewAction): DatamodelViewState => {
    switch (action.type) {
        case 'SET_CURRENT_GROUP':
            return { ...state, currentGroup: action.payload }
        case 'SET_CURRENT_SECTION':
            return { ...state, currentSection: action.payload }
        case 'SET_SCROLL_TO_SECTION':
            return { ...state, scrollToSection: action.payload }
        case 'SET_SCROLL_TO_GROUP':
            return { ...state, scrollToGroup: action.payload }
        case 'SET_LOADING':
            return { ...state, loading: action.payload }
        case 'SET_LOADING_SECTION':
            return { ...state, loadingSection: action.payload }
        case 'SET_RESTORE_SECTION':
            return { ...state, restoreSection: action.payload }
        case 'SET_SCROLL_TO_ATTRIBUTE':
            return { ...state, scrollToAttribute: action.payload }
        case 'SET_SCROLL_TO_RELATIONSHIP':
            return { ...state, scrollToRelationship: action.payload }
        default:
            return state;
    }
}

const DatamodelViewContext = createContext<DatamodelViewState>(initialState);
const DatamodelViewDispatcher = createContext<React.Dispatch<DatamodelViewAction>>(() => { });
export const DatamodelViewProvider = ({ children }: { children: ReactNode }) => {
    const [datamodelViewState, dispatch] = useReducer(datamodelViewReducer, initialState);

    const searchParams = useSearchParams();
    const sectionParam = searchParams.get('section');
    const groupParam = searchParams.get('group');

    // on initial load set data from query params
    useEffect(() => {
        if (!sectionParam) return;
        try { datamodelViewState.scrollToSection(""); } catch { return; }
        dispatch({ type: "SET_CURRENT_GROUP", payload: groupParam });
        dispatch({ type: "SET_CURRENT_SECTION", payload: sectionParam });
        datamodelViewState.scrollToSection(sectionParam);
    }, [datamodelViewState.scrollToSection])

    return (
        <DatamodelViewContext.Provider value={{ ...datamodelViewState }}>
            <DatamodelViewDispatcher.Provider value={dispatch}>
                {children}
            </DatamodelViewDispatcher.Provider>
        </DatamodelViewContext.Provider>
    )
}

export const useDatamodelView = () => useContext(DatamodelViewContext);
export const useDatamodelViewDispatch = () => useContext(DatamodelViewDispatcher);