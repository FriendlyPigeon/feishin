import {
    LidarrAlbum,
    LidarrArtist,
    LidarrArtistLookup,
    LidarrImage,
} from '/@/renderer/api/lidarr/lidarr-types';
import {
    Album,
    AlbumArtist,
    LibraryItem,
    RelatedArtist,
    ServerType,
} from '/@/shared/types/domain-types';

const LIDARR_SERVER_ID = 'lidarr';

const appendApiKey = (url: string, apiKey?: string): string => {
    if (!apiKey) {
        return url;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}apikey=${encodeURIComponent(apiKey)}`;
};

const toLidarrApiCoverUrl = (url: string, baseUrl: string): string => {
    const normalizedBase = baseUrl.replace(/\/$/, '');

    const albumMatch = url.match(/\/MediaCover\/Albums\/(\d+)\/([^?]+)/i);
    if (albumMatch) {
        return `${normalizedBase}/api/v1/mediacover/album/${albumMatch[1]}/${albumMatch[2]}`;
    }

    const artistMatch = url.match(/\/MediaCover\/(\d+)\/([^?]+)/i);
    if (artistMatch) {
        return `${normalizedBase}/api/v1/mediacover/artist/${artistMatch[1]}/${artistMatch[2]}`;
    }

    return url;
};

const resolveImageUrl = (
    image: LidarrImage | undefined,
    baseUrl?: string,
    apiKey?: string,
): null | string => {
    if (!image) {
        return null;
    }

    const localUrl = image.url;
    if (localUrl) {
        const absoluteUrl = localUrl.startsWith('http')
            ? localUrl
            : baseUrl
              ? `${baseUrl.replace(/\/$/, '')}${localUrl.startsWith('/') ? '' : '/'}${localUrl}`
              : null;

        if (absoluteUrl) {
            return appendApiKey(toLidarrApiCoverUrl(absoluteUrl, baseUrl || ''), apiKey);
        }
    }

    return image.remoteUrl ? appendApiKey(image.remoteUrl, apiKey) : null;
};

const getImageUrl = (
    images: LidarrImage[] | undefined,
    baseUrl?: string,
    apiKey?: string,
): null | string => {
    if (!images || images.length === 0) {
        return null;
    }

    const poster = images.find(
        (image) => image.coverType === 'cover' || image.coverType === 'poster',
    );

    return resolveImageUrl(poster ?? images[0], baseUrl, apiKey);
};

const parseReleaseYear = (releaseDate: string | undefined): null | number => {
    if (!releaseDate) {
        return null;
    }

    const year = Number(releaseDate.slice(0, 4));
    return Number.isNaN(year) ? null : year;
};

const normalizeReleaseType = (albumType: string | undefined): string => {
    if (!albumType) {
        return 'album';
    }

    return albumType.toLowerCase().replace(/\s+/g, '-');
};

export const normalizeLidarrArtist = (
    artist: LidarrArtistLookup,
    baseUrl?: string,
    apiKey?: string,
): RelatedArtist => {
    return {
        id: artist.foreignArtistId,
        imageId: null,
        imageUrl: getImageUrl(artist.images, baseUrl, apiKey),
        name: artist.artistName,
        userFavorite: false,
        userRating: null,
    };
};

export const normalizeLidarrAlbum = (
    album: LidarrAlbum,
    artist?: LidarrArtist,
    baseUrl?: string,
    apiKey?: string,
): Album => {
    const albumArtist = artist || album.artist;
    const relatedArtist = albumArtist ? normalizeLidarrArtist(albumArtist, baseUrl, apiKey) : null;
    const albumArtists: RelatedArtist[] = relatedArtist ? [relatedArtist] : [];
    const releaseYear = parseReleaseYear(album.releaseDate);
    const releaseType = normalizeReleaseType(album.albumType);

    return {
        _itemType: LibraryItem.ALBUM,
        _serverId: LIDARR_SERVER_ID,
        _serverType: ServerType.JELLYFIN,
        albumArtistName: relatedArtist?.name || '',
        albumArtists,
        artists: albumArtists,
        blurHash: null,
        comment: null,
        createdAt: album.releaseDate || '',
        discs: null,
        dominantColor: null,
        duration: null,
        explicitStatus: null,
        gain: null,
        genres: [],
        id: album.foreignAlbumId,
        imageId: null,
        imageUrl: getImageUrl(album.images, baseUrl, apiKey),
        isCompilation: releaseType === 'compilation',
        lastPlayedAt: null,
        mbzId: null,
        mbzReleaseGroupId: album.foreignAlbumId,
        missing: true,
        name: album.title,
        originalDate: null,
        originalYear: null,
        participants: null,
        peak: null,
        playCount: null,
        ratedAt: null,
        recordLabels: [],
        releaseDate: album.releaseDate || null,
        releaseType,
        releaseTypes: [releaseType],
        releaseYear,
        size: null,
        songCount: null,
        sortName: album.title,
        starredAt: null,
        tags: null,
        thumbHash: null,
        trackYearRange: null,
        updatedAt: album.releaseDate || '',
        userFavorite: false,
        userRating: null,
        version: null,
    };
};

export const isLidarrAlbumInLibrary = (lidarrAlbum: Album, libraryAlbums: Album[]): boolean => {
    if (lidarrAlbum.mbzReleaseGroupId) {
        const mbzMatch = libraryAlbums.find(
            (libraryAlbum) =>
                libraryAlbum.mbzReleaseGroupId &&
                libraryAlbum.mbzReleaseGroupId === lidarrAlbum.mbzReleaseGroupId,
        );
        if (mbzMatch) {
            return true;
        }
    }

    const normalizedLidarrName = lidarrAlbum.name.toLowerCase().trim();
    const fallbackMatch = libraryAlbums.find((libraryAlbum) => {
        const normalizedLibraryName = libraryAlbum.name.toLowerCase().trim();
        const nameMatch = normalizedLibraryName === normalizedLidarrName;
        const yearMatch =
            lidarrAlbum.releaseYear === null ||
            libraryAlbum.releaseYear === null ||
            lidarrAlbum.releaseYear === libraryAlbum.releaseYear;
        return nameMatch && yearMatch;
    });

    return Boolean(fallbackMatch);
};

export const normalizeLidarrAlbumArtist = (
    artist: LidarrArtist,
    baseUrl?: string,
    apiKey?: string,
): AlbumArtist => {
    const relatedArtist = normalizeLidarrArtist(artist, baseUrl, apiKey);

    return {
        _itemType: LibraryItem.ALBUM_ARTIST,
        _serverId: LIDARR_SERVER_ID,
        _serverType: ServerType.JELLYFIN,
        albumCount: null,
        biography: null,
        blurHash: null,
        dominantColor: null,
        duration: null,
        genres: [],
        id: artist.foreignArtistId,
        imageId: null,
        imageUrl: relatedArtist.imageUrl,
        lastPlayedAt: null,
        mbz: artist.foreignArtistId,
        missing: true,
        name: artist.artistName,
        playCount: null,
        ratedAt: null,
        similarArtists: null,
        songCount: null,
        starredAt: null,
        thumbHash: null,
        userFavorite: false,
        userRating: null,
    };
};
