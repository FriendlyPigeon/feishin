import axios, { AxiosError, isAxiosError } from 'axios';

import {
    LidarrAddArtistBody,
    LidarrAlbum,
    LidarrArtist,
    LidarrCommandBody,
    LidarrMetadataProfile,
    LidarrMonitorAlbumsBody,
    LidarrQualityProfile,
    LidarrRootFolder,
    LidarrSystemStatus,
} from '/@/renderer/api/lidarr/lidarr-types';
import { normalizeServerUrl } from '/@/renderer/utils/normalize-server-url';
import { toast } from '/@/shared/components/toast/toast';

const getHeaders = (apiKey: string) => ({
    'X-Api-Key': apiKey,
});

const getBaseUrl = (url: string) => {
    const normalized = normalizeServerUrl(url);
    return `${normalized}/api/v1`;
};

const handleError = (error: unknown, defaultMessage: string): string => {
    if (isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
            const status = axiosError.response.status;
            if (status === 401) {
                return 'error.lidarr.unauthorized';
            }
            if (status === 404) {
                return 'error.lidarr.notFound';
            }
        }
        return axiosError.message || defaultMessage;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return defaultMessage;
};

export const lidarrClient = {
    addArtist: async (
        url: string,
        apiKey: string,
        body: LidarrAddArtistBody,
    ): Promise<LidarrArtist> => {
        try {
            const response = await axios.post<LidarrArtist>(`${getBaseUrl(url)}/artist`, body, {
                headers: getHeaders(apiKey),
            });
            return response.data;
        } catch (error) {
            throw new Error(handleError(error, 'Failed to add artist to Lidarr'));
        }
    },
    getAlbum: async (url: string, apiKey: string, albumId: number): Promise<LidarrAlbum> => {
        try {
            const response = await axios.get<LidarrAlbum>(`${getBaseUrl(url)}/album/${albumId}`, {
                headers: getHeaders(apiKey),
            });
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to fetch Lidarr album');
            toast.error({ message });
            throw new Error(message);
        }
    },
    getAlbumsByArtist: async (
        url: string,
        apiKey: string,
        artistId: number,
    ): Promise<LidarrAlbum[]> => {
        try {
            const response = await axios.get<LidarrAlbum[]>(`${getBaseUrl(url)}/album`, {
                headers: getHeaders(apiKey),
                params: { artistId },
            });
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to fetch Lidarr albums');
            toast.error({ message });
            throw new Error(message);
        }
    },
    getArtist: async (url: string, apiKey: string, artistId: number): Promise<LidarrArtist> => {
        try {
            const response = await axios.get<LidarrArtist>(
                `${getBaseUrl(url)}/artist/${artistId}`,
                {
                    headers: getHeaders(apiKey),
                },
            );
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to fetch Lidarr artist');
            toast.error({ message });
            throw new Error(message);
        }
    },
    getArtistByMbid: async (
        url: string,
        apiKey: string,
        mbid: string,
    ): Promise<LidarrArtist | null> => {
        try {
            const response = await axios.get<LidarrArtist[]>(`${getBaseUrl(url)}/artist`, {
                headers: getHeaders(apiKey),
                params: { mbId: mbid },
            });
            return response.data?.[0] ?? null;
        } catch (error) {
            const message = handleError(error, 'Failed to fetch Lidarr artist by MusicBrainz ID');
            toast.error({ message });
            throw new Error(message);
        }
    },
    getMetadataProfiles: async (url: string, apiKey: string): Promise<LidarrMetadataProfile[]> => {
        try {
            const response = await axios.get<LidarrMetadataProfile[]>(
                `${getBaseUrl(url)}/metadataProfile`,
                {
                    headers: getHeaders(apiKey),
                },
            );
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to fetch Lidarr metadata profiles');
            toast.error({ message });
            throw new Error(message);
        }
    },
    getQualityProfiles: async (url: string, apiKey: string): Promise<LidarrQualityProfile[]> => {
        try {
            const response = await axios.get<LidarrQualityProfile[]>(
                `${getBaseUrl(url)}/qualityProfile`,
                {
                    headers: getHeaders(apiKey),
                },
            );
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to fetch Lidarr quality profiles');
            toast.error({ message });
            throw new Error(message);
        }
    },
    getRootFolders: async (url: string, apiKey: string): Promise<LidarrRootFolder[]> => {
        try {
            const response = await axios.get<LidarrRootFolder[]>(`${getBaseUrl(url)}/rootFolder`, {
                headers: getHeaders(apiKey),
            });
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to fetch Lidarr root folders');
            toast.error({ message });
            throw new Error(message);
        }
    },
    lookupAlbum: async (url: string, apiKey: string, term: string): Promise<LidarrAlbum[]> => {
        try {
            const response = await axios.get<LidarrAlbum[]>(`${getBaseUrl(url)}/album/lookup`, {
                headers: getHeaders(apiKey),
                params: { term },
            });
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to lookup Lidarr album');
            toast.error({ message });
            throw new Error(message);
        }
    },
    lookupArtist: async (url: string, apiKey: string, term: string): Promise<LidarrArtist[]> => {
        try {
            const response = await axios.get<LidarrArtist[]>(`${getBaseUrl(url)}/artist/lookup`, {
                headers: getHeaders(apiKey),
                params: { term },
            });
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to lookup Lidarr artist');
            toast.error({ message });
            throw new Error(message);
        }
    },
    monitorAlbums: async (
        url: string,
        apiKey: string,
        body: LidarrMonitorAlbumsBody,
    ): Promise<LidarrAlbum[]> => {
        try {
            const response = await axios.put<LidarrAlbum[]>(
                `${getBaseUrl(url)}/album/monitor`,
                body,
                {
                    headers: getHeaders(apiKey),
                },
            );
            return response.data;
        } catch (error) {
            throw new Error(handleError(error, 'Failed to monitor Lidarr albums'));
        }
    },
    searchAlbums: async (url: string, apiKey: string, albumIds: number[]): Promise<unknown> => {
        return lidarrClient.sendCommand(url, apiKey, { albumIds, name: 'AlbumSearch' });
    },
    sendCommand: async (url: string, apiKey: string, body: LidarrCommandBody): Promise<unknown> => {
        try {
            const response = await axios.post<unknown>(`${getBaseUrl(url)}/command`, body, {
                headers: getHeaders(apiKey),
            });
            return response.data;
        } catch (error) {
            throw new Error(handleError(error, 'Failed to send Lidarr command'));
        }
    },
    testConnection: async (url: string, apiKey: string): Promise<LidarrSystemStatus> => {
        try {
            const response = await axios.get<LidarrSystemStatus>(
                `${getBaseUrl(url)}/system/status`,
                {
                    headers: getHeaders(apiKey),
                },
            );
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to connect to Lidarr');
            throw new Error(message);
        }
    },
    updateAlbum: async (url: string, apiKey: string, album: LidarrAlbum): Promise<LidarrAlbum> => {
        try {
            const response = await axios.put<LidarrAlbum>(
                `${getBaseUrl(url)}/album/${album.id}`,
                album,
                {
                    headers: getHeaders(apiKey),
                },
            );
            return response.data;
        } catch (error) {
            const message = handleError(error, 'Failed to update Lidarr album');
            toast.error({ message });
            throw new Error(message);
        }
    },
};
