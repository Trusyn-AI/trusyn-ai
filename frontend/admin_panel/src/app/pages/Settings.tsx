import { useEffect, useMemo, useState } from 'react';
import { GlowCard } from '../components/GlowCard';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { settingsService } from '../api/services/settingsService';
import type { ApiKeyListItem, IntegrationDto, OrganizationDto, UserDto } from '../api/types/admin';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function Settings() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [organization, setOrganization] = useState<OrganizationDto | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationDto[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const [profileDraft, setProfileDraft] = useState({
    full_name: '',
    avatar_url: '',
    preferences: '{\n  "theme": "dark"\n}',
  });

  const [organizationDraft, setOrganizationDraft] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    settings: '{\n  "notifications": true\n}',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentUser, currentOrg, integrationRows, apiKeyRows] = await Promise.all([
        settingsService.getCurrentUser(),
        settingsService.getCurrentOrganization(),
        settingsService.listIntegrations(),
        settingsService.listApiKeys(),
      ]);

      setUser(currentUser);
      setOrganization(currentOrg);
      setIntegrations(integrationRows);
      setApiKeys(apiKeyRows);

      setProfileDraft({
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url ?? '',
        preferences: JSON.stringify(currentUser.preferences ?? {}, null, 2),
      });

      setOrganizationDraft({
        name: currentOrg.name,
        slug: currentOrg.slug,
        description: currentOrg.description ?? '',
        website: currentOrg.website ?? '',
        settings: JSON.stringify(currentOrg.settings ?? {}, null, 2),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetSaveState = () => {
    window.setTimeout(() => setSaveState('idle'), 1600);
  };

  const saveProfile = async () => {
    setSaveState('saving');
    setError(null);
    try {
      const preferences = JSON.parse(profileDraft.preferences || '{}') as Record<string, unknown>;
      const updated = await settingsService.updateCurrentUser({
        full_name: profileDraft.full_name,
        avatar_url: profileDraft.avatar_url || null,
        preferences,
      });
      setUser(updated);
      setSaveState('saved');
      resetSaveState();
    } catch (err) {
      setSaveState('error');
      setError(err instanceof Error ? err.message : 'Unable to save profile changes');
      resetSaveState();
    }
  };

  const saveOrganization = async () => {
    setSaveState('saving');
    setError(null);
    try {
      const settings = JSON.parse(organizationDraft.settings || '{}') as Record<string, unknown>;
      const updated = await settingsService.updateCurrentOrganization({
        name: organizationDraft.name,
        slug: organizationDraft.slug,
        description: organizationDraft.description || null,
        website: organizationDraft.website || null,
        settings,
      });
      setOrganization(updated);
      setSaveState('saved');
      resetSaveState();
    } catch (err) {
      setSaveState('error');
      setError(err instanceof Error ? err.message : 'Unable to save organization settings');
      resetSaveState();
    }
  };

  const toggleIntegration = async (integration: IntegrationDto, enabled: boolean) => {
    setError(null);
    try {
      const updated = await settingsService.updateIntegration(integration.key, {
        enabled,
        config: integration.config,
      });
      setIntegrations((prev) => prev.map((item) => (item.key === updated.key ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update integration');
    }
  };

  const createApiKey = async () => {
    if (!newApiKeyName.trim()) {
      setError('API key name is required.');
      return;
    }
    setError(null);
    try {
      const created = await settingsService.createApiKey({
        name: newApiKeyName.trim(),
        permissions: { scope: 'platform:admin' },
      });
      setCreatedKey(created.key);
      setNewApiKeyName('');
      const updatedKeys = await settingsService.listApiKeys();
      setApiKeys(updatedKeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create API key');
    }
  };

  const removeApiKey = async (id: string) => {
    setError(null);
    try {
      await settingsService.deleteApiKey(id);
      setApiKeys((prev) => prev.filter((key) => key.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete API key');
    }
  };

  const saveIndicator = useMemo(() => {
    if (saveState === 'saving') return 'Saving...';
    if (saveState === 'saved') return 'Saved';
    if (saveState === 'error') return 'Save failed';
    return null;
  }, [saveState]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure platform settings and preferences</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {saveIndicator && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
          {saveIndicator}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard glow glowColor="purple">
          <h3 className="text-lg font-semibold mb-4">User Profile</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profile-name">Full Name</Label>
              <Input id="profile-name" value={profileDraft.full_name} onChange={(e) => setProfileDraft((prev) => ({ ...prev, full_name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="profile-avatar">Avatar URL</Label>
              <Input id="profile-avatar" value={profileDraft.avatar_url} onChange={(e) => setProfileDraft((prev) => ({ ...prev, avatar_url: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="profile-preferences">Preferences (JSON)</Label>
              <Textarea id="profile-preferences" rows={6} value={profileDraft.preferences} onChange={(e) => setProfileDraft((prev) => ({ ...prev, preferences: e.target.value }))} />
            </div>
            <Button className="w-full bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8]" onClick={() => void saveProfile()}>
              Save Profile
            </Button>
          </div>
        </GlowCard>

        <GlowCard glow glowColor="cyan">
          <h3 className="text-lg font-semibold mb-4">Organization Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" value={organizationDraft.name} onChange={(e) => setOrganizationDraft((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="org-slug">Slug</Label>
              <Input id="org-slug" value={organizationDraft.slug} onChange={(e) => setOrganizationDraft((prev) => ({ ...prev, slug: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="org-description">Description</Label>
              <Textarea id="org-description" rows={3} value={organizationDraft.description} onChange={(e) => setOrganizationDraft((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="org-website">Website</Label>
              <Input id="org-website" value={organizationDraft.website} onChange={(e) => setOrganizationDraft((prev) => ({ ...prev, website: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="org-settings">Organization Settings (JSON)</Label>
              <Textarea id="org-settings" rows={6} value={organizationDraft.settings} onChange={(e) => setOrganizationDraft((prev) => ({ ...prev, settings: e.target.value }))} />
            </div>
            <Button className="w-full bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8]" onClick={() => void saveOrganization()}>
              Save Organization
            </Button>
          </div>
        </GlowCard>
      </div>

      <GlowCard glow glowColor="gradient">
        <h3 className="text-lg font-semibold mb-4">Integrations</h3>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.key} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{integration.key}</p>
                <p className="text-xs text-muted-foreground">{JSON.stringify(integration.config)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`integration-${integration.key}`} className="text-xs">Enabled</Label>
                <Switch
                  id={`integration-${integration.key}`}
                  checked={integration.enabled}
                  onCheckedChange={(checked) => void toggleIntegration(integration, checked)}
                />
              </div>
            </div>
          ))}
          {integrations.length === 0 && <p className="text-sm text-muted-foreground">No integrations configured.</p>}
        </div>
      </GlowCard>

      <GlowCard glow glowColor="purple">
        <h3 className="text-lg font-semibold mb-4">API Keys</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="New API key name" value={newApiKeyName} onChange={(e) => setNewApiKeyName(e.target.value)} />
            <Button className="bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8]" onClick={() => void createApiKey()}>
              Create Key
            </Button>
          </div>

          {createdKey && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
              <p className="font-medium text-green-300">New API key generated (copy now)</p>
              <p className="mt-2 font-mono break-all text-green-100">{createdKey}</p>
            </div>
          )}

          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground">Created {new Date(key.created_at).toLocaleString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void removeApiKey(key.id)}>
                  Delete
                </Button>
              </div>
            ))}
            {apiKeys.length === 0 && <p className="text-sm text-muted-foreground">No API keys found.</p>}
          </div>
        </div>
      </GlowCard>

      <GlowCard glow glowColor="gradient">
        <h3 className="text-lg font-semibold mb-4">Runtime Toggles</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Push Notifications</Label>
            <Switch id="notifications" checked={Boolean(user?.preferences?.notifications ?? true)} disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="alerts">Critical Alert Emails</Label>
            <Switch id="alerts" checked={Boolean(organization?.settings?.critical_alerts ?? true)} disabled />
          </div>
          <p className="text-xs text-muted-foreground">Runtime toggles are driven by organization settings JSON above.</p>
        </div>
      </GlowCard>
    </div>
  );
}
