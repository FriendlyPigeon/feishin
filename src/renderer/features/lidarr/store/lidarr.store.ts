import merge from 'lodash/merge';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

export type LidarrArtistMonitorMode = 'all' | 'future' | 'none';

export interface LidarrConfig {
    apiKey: string;
    enabled: boolean;
    url: string;
}

export interface LidarrConnectionStatus {
    error: null | string;
    isReachable: boolean | null;
    isTesting: boolean;
}

export interface LidarrDefaults {
    artistMonitorMode: LidarrArtistMonitorMode;
    metadataProfileId: null | number;
    qualityProfileId: null | number;
    rootFolderPath: null | string;
    searchForMissingAlbums: boolean;
}

export interface LidarrSlice extends LidarrState {
    actions: {
        setConfig: (config: Partial<LidarrConfig>) => void;
        setDefaults: (defaults: Partial<LidarrDefaults>) => void;
        setStatus: (status: LidarrConnectionStatus) => void;
    };
}

export interface LidarrState extends LidarrConfig, LidarrDefaults {
    status: LidarrConnectionStatus;
}

const initialDefaults: LidarrDefaults = {
    artistMonitorMode: 'none',
    metadataProfileId: null,
    qualityProfileId: null,
    rootFolderPath: null,
    searchForMissingAlbums: false,
};

const initialState: LidarrState = {
    apiKey: '',
    enabled: false,
    ...initialDefaults,
    status: {
        error: null,
        isReachable: null,
        isTesting: false,
    },
    url: '',
};

export const useLidarrStore = createWithEqualityFn<LidarrSlice>()(
    persist(
        devtools(
            immer((set) => ({
                ...initialState,
                actions: {
                    setConfig: (config) => {
                        set((state) => {
                            Object.assign(state, config);
                            // Reset reachability and defaults when credentials change.
                            if (config.url !== undefined || config.apiKey !== undefined) {
                                state.status = { ...initialState.status };
                                Object.assign(state, initialDefaults);
                            }
                        });
                    },
                    setDefaults: (defaults) => {
                        set((state) => {
                            Object.assign(state, defaults);
                        });
                    },
                    setStatus: (status) => {
                        set((state) => {
                            state.status = status;
                        });
                    },
                },
            })),
            { name: 'store_lidarr' },
        ),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_lidarr',
            version: 1,
        },
    ),
);

export const useLidarrActions = () => useLidarrStore((state) => state.actions);

export const useLidarrConfig = (): LidarrConfig =>
    useLidarrStore((state) => ({
        apiKey: state.apiKey,
        enabled: state.enabled,
        url: state.url,
    }));

export const useLidarrDefaults = (): LidarrDefaults =>
    useLidarrStore((state) => ({
        artistMonitorMode: state.artistMonitorMode,
        metadataProfileId: state.metadataProfileId,
        qualityProfileId: state.qualityProfileId,
        rootFolderPath: state.rootFolderPath,
        searchForMissingAlbums: state.searchForMissingAlbums,
    }));

export const useLidarrStatus = () => useLidarrStore((state) => state.status);

export const useLidarrEnabled = () => useLidarrStore((state) => state.enabled);
