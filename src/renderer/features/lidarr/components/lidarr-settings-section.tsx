import { useQuery } from '@tanstack/react-query';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { lidarrClient } from '/@/renderer/api/lidarr/lidarr-client';
import { lidarrQueries } from '/@/renderer/features/lidarr/api/lidarr-queries';
import {
    LidarrConnectionStatus,
    useLidarrActions,
    useLidarrConfig,
    useLidarrDefaults,
    useLidarrEnabled,
    useLidarrStatus,
} from '/@/renderer/features/lidarr/store/lidarr.store';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Select } from '/@/shared/components/select/select';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';

export const LidarrSettingsSection = memo(() => {
    const { t } = useTranslation();
    const config = useLidarrConfig();
    const defaults = useLidarrDefaults();
    const status = useLidarrStatus();
    const enabled = useLidarrEnabled();
    const { setConfig, setDefaults, setStatus } = useLidarrActions();
    const [isTesting, setIsTesting] = useState(false);

    const configReady = enabled && Boolean(config.url) && Boolean(config.apiKey);
    const listsEnabled = configReady && status.isReachable === true;

    const rootFoldersQuery = useQuery(lidarrQueries.rootFolders({ enabled: listsEnabled }));
    const qualityProfilesQuery = useQuery(lidarrQueries.qualityProfiles({ enabled: listsEnabled }));
    const metadataProfilesQuery = useQuery(
        lidarrQueries.metadataProfiles({ enabled: listsEnabled }),
    );

    const rootFolderData = useMemo(
        () =>
            (rootFoldersQuery.data || []).map((folder) => ({
                label: folder.path,
                value: folder.path,
            })),
        [rootFoldersQuery.data],
    );

    const qualityProfileData = useMemo(
        () =>
            (qualityProfilesQuery.data || []).map((profile) => ({
                label: profile.name,
                value: String(profile.id),
            })),
        [qualityProfilesQuery.data],
    );

    const metadataProfileData = useMemo(
        () =>
            (metadataProfilesQuery.data || []).map((profile) => ({
                label: profile.name,
                value: String(profile.id),
            })),
        [metadataProfilesQuery.data],
    );

    useEffect(() => {
        if (!defaults.rootFolderPath && rootFolderData.length > 0) {
            setDefaults({ rootFolderPath: rootFolderData[0].value });
        }
    }, [defaults.rootFolderPath, rootFolderData, setDefaults]);

    useEffect(() => {
        if (!defaults.qualityProfileId && qualityProfileData.length > 0) {
            setDefaults({ qualityProfileId: Number(qualityProfileData[0].value) });
        }
    }, [defaults.qualityProfileId, qualityProfileData, setDefaults]);

    useEffect(() => {
        if (!defaults.metadataProfileId && metadataProfileData.length > 0) {
            setDefaults({ metadataProfileId: Number(metadataProfileData[0].value) });
        }
    }, [defaults.metadataProfileId, metadataProfileData, setDefaults]);

    const handleTestConnection = useCallback(async () => {
        if (!config.url || !config.apiKey) {
            toast.error({
                message: t('error.lidarr.missingCredentials'),
            });
            return;
        }

        setIsTesting(true);
        setStatus({
            error: null,
            isReachable: null,
            isTesting: true,
        });

        try {
            const systemStatus = await lidarrClient.testConnection(config.url, config.apiKey);
            const nextStatus: LidarrConnectionStatus = {
                error: null,
                isReachable: true,
                isTesting: false,
            };
            setStatus(nextStatus);
            toast.success({
                message: t('setting.lidarr.connectionSuccess', {
                    version: systemStatus.version,
                }),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const nextStatus: LidarrConnectionStatus = {
                error: message,
                isReachable: false,
                isTesting: false,
            };
            setStatus(nextStatus);
            toast.error({ message });
        } finally {
            setIsTesting(false);
        }
    }, [config.apiKey, config.url, setStatus, t]);

    const options: SettingOption[] = [
        {
            control: (
                <Switch
                    checked={config.enabled}
                    onChange={(e) => {
                        setConfig({ enabled: e.currentTarget.checked });
                    }}
                />
            ),
            description: t('setting.lidarr.enabled', {
                context: 'description',
            }),
            title: t('setting.lidarr.enabled'),
        },
        {
            control: (
                <TextInput
                    disabled={!config.enabled}
                    onChange={(e) => {
                        setConfig({ url: e.currentTarget.value });
                    }}
                    placeholder="http://localhost:8686"
                    value={config.url}
                    width={350}
                />
            ),
            description: t('setting.lidarr.url', {
                context: 'description',
            }),
            title: t('setting.lidarr.url'),
        },
        {
            control: (
                <PasswordInput
                    disabled={!config.enabled}
                    onChange={(e) => {
                        setConfig({ apiKey: e.currentTarget.value });
                    }}
                    placeholder="Lidarr API key"
                    value={config.apiKey}
                    width={350}
                />
            ),
            description: t('setting.lidarr.apiKey', {
                context: 'description',
            }),
            title: t('setting.lidarr.apiKey'),
        },
        {
            control: (
                <Group gap="sm">
                    <Button
                        disabled={!config.enabled || !config.url || !config.apiKey || isTesting}
                        leftSection={isTesting ? <Spinner size={16} /> : null}
                        onClick={handleTestConnection}
                        variant="subtle"
                    >
                        {t('setting.lidarr.testConnection')}
                    </Button>
                    {status.isReachable === true && <span>{t('setting.lidarr.connectionOk')}</span>}
                    {status.isReachable === false && status.error && <span>{status.error}</span>}
                </Group>
            ),
            description: t('setting.lidarr.testConnection', {
                context: 'description',
            }),
            title: t('setting.lidarr.testConnection'),
        },
        {
            control: (
                <Select
                    data={rootFolderData}
                    disabled={!listsEnabled || rootFolderData.length === 0}
                    onChange={(value) => {
                        if (value) setDefaults({ rootFolderPath: value });
                    }}
                    placeholder={t('setting.lidarr.rootFolder', { context: 'placeholder' })}
                    value={defaults.rootFolderPath}
                />
            ),
            description: t('setting.lidarr.rootFolder', {
                context: 'description',
            }),
            isHidden: !config.enabled,
            title: t('setting.lidarr.rootFolder'),
        },
        {
            control: (
                <Select
                    data={qualityProfileData}
                    disabled={!listsEnabled || qualityProfileData.length === 0}
                    onChange={(value) => {
                        if (value) setDefaults({ qualityProfileId: Number(value) });
                    }}
                    placeholder={t('setting.lidarr.qualityProfile', { context: 'placeholder' })}
                    value={
                        defaults.qualityProfileId ? String(defaults.qualityProfileId) : undefined
                    }
                />
            ),
            description: t('setting.lidarr.qualityProfile', {
                context: 'description',
            }),
            isHidden: !config.enabled,
            title: t('setting.lidarr.qualityProfile'),
        },
        {
            control: (
                <Select
                    data={metadataProfileData}
                    disabled={!listsEnabled || metadataProfileData.length === 0}
                    onChange={(value) => {
                        if (value) setDefaults({ metadataProfileId: Number(value) });
                    }}
                    placeholder={t('setting.lidarr.metadataProfile', { context: 'placeholder' })}
                    value={
                        defaults.metadataProfileId ? String(defaults.metadataProfileId) : undefined
                    }
                />
            ),
            description: t('setting.lidarr.metadataProfile', {
                context: 'description',
            }),
            isHidden: !config.enabled,
            title: t('setting.lidarr.metadataProfile'),
        },
    ];

    return <SettingsSection options={options} title={t('setting.lidarr.title')} />;
});
