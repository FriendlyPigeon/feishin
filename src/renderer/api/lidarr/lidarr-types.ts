export interface LidarrAddArtistBody {
    addOptions?: {
        ignoreExistingAlbums?: boolean;
        monitor?: string;
        searchForMissingAlbums?: boolean;
    };
    artistName: string;
    foreignArtistId: string;
    metadataProfileId: number;
    monitor: string;
    monitored: boolean;
    qualityProfileId: number;
    rootFolderPath: string;
}

export interface LidarrAlbum {
    albumType: string;
    artist: LidarrArtistLookup;
    foreignAlbumId: string;
    id?: number;
    images: LidarrImage[];
    monitored: boolean;
    releaseDate?: string;
    title: string;
}

export interface LidarrArtist extends LidarrArtistLookup {
    albums: LidarrAlbum[];
}

export interface LidarrArtistLookup {
    artistName: string;
    foreignArtistId: string;
    id?: number;
    images: LidarrImage[];
    monitored: boolean;
}

export interface LidarrCommandBody {
    albumId?: number;
    artistId?: number;
    name: string;
}

export interface LidarrImage {
    coverType: string;
    extension: string;
    remoteUrl: string;
    url: string;
}

export interface LidarrMetadataProfile {
    id: number;
    name: string;
}

export interface LidarrQualityProfile {
    id: number;
    name: string;
}

export interface LidarrRootFolder {
    accessible: string;
    freeSpace: number;
    id: number;
    path: string;
    unmappedFolders: unknown[];
}

export interface LidarrSystemStatus {
    appData: string;
    branch: string;
    buildTime: string;
    isDebug: boolean;
    isDocker: boolean;
    isLinux: boolean;
    isNetCore: boolean;
    isOsx: boolean;
    isProduction: boolean;
    isWindows: boolean;
    migrationVersion: number;
    osName: string;
    runtimeName: string;
    runtimeVersion: string;
    startupPath: string;
    urlBase: string;
    version: string;
}
