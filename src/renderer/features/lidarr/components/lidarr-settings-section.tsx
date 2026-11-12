import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { lidarrClient } from '/@/renderer/api/lidarr/lidarr-client';
import {
    LidarrConnectionStatus,
    useLidarrActions,
    useLidarrConfig,
    useLidarrStatus,
} from '/@/renderer/features/lidarr/store/lidarr.store';
import {
    SettingOption,
    SettingsSection,
} from '/@/renderer/features/settings/components/settings-section';
import { Button } from '/@/shared/components/button/button';
import { Group } from '/@/shared/components/group/group';
import { PasswordInput } from '/@/shared/components/password-input/password-input';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Switch } from '/@/shared/components/switch/switch';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';

export const LidarrSettingsSection = memo(() => {
    const { t } = useTranslation();
    const config = useLidarrConfig();
    const status = useLidarrStatus();
    const { setConfig, setStatus } = useLidarrActions();
    const [isTesting, setIsTesting] = useState(false);

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
    ];

    return <SettingsSection options={options} title={t('setting.lidarr.title')} />;
});
