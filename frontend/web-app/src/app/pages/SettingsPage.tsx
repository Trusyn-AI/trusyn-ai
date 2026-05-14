import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Copy, KeyRound, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { settingsService } from '../api/services/settingsService';
import type { ApiKeyCreateResponseDto, ApiKeyItemDto, IntegrationDto } from '../api/types/domain';
import type { OrganizationDto, UserDto } from '../api/types/auth';
import { ApiError } from '../api/errors';
import { setSessionUser } from '../utils/sessionUser';
import { useSessionUser } from '../state/session';

function parseError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Unable to update settings.';
}

function makeInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function SettingsPage() {
  const sessionUser = useSessionUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [user, setUser] = useState<UserDto | null>(null);
  const [organization, setOrganization] = useState<OrganizationDto | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationDto[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItemDto[]>([]);

  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');

  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissionsText, setNewKeyPermissionsText] = useState('{\n  "scope": "runtime"\n}');
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResponseDto | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [orgSaving, setOrgSaving] = useState(false);
  const [integrationSavingKey, setIntegrationSavingKey] = useState<string | null>(null);
  const [apiKeyCreating, setApiKeyCreating] = useState(false);
  const [apiKeyDeleting, setApiKeyDeleting] = useState<string | null>(null);

  const canManageOrg = sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ORG_ADMIN';

  const loadAll = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [currentUser, currentOrg, integrationItems, keyItems] = await Promise.all([
        settingsService.getCurrentUser(),
        settingsService.getCurrentOrganization(),
        settingsService.listIntegrations(),
        settingsService.listApiKeys(),
      ]);

      setUser(currentUser);
      setOrganization(currentOrg);
      setIntegrations(integrationItems);
      setApiKeys(keyItems);

      setProfileName(currentUser.full_name);
      setProfileAvatar(currentUser.avatar_url ?? '');
      setOrgName(currentOrg.name);
      setOrgDescription(currentOrg.description ?? '');
      setOrgWebsite(currentOrg.website ?? '');

      setError(null);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setProfileSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: {
        full_name?: string;
        avatar_url?: string | null;
        current_password?: string;
        new_password?: string;
      } = {
        full_name: profileName.trim(),
        avatar_url: profileAvatar.trim() || null,
      };

      if (profileCurrentPassword.trim() || profileNewPassword.trim()) {
        payload.current_password = profileCurrentPassword;
        payload.new_password = profileNewPassword;
      }

      const updatedUser = await settingsService.updateCurrentUser(payload);
      setUser(updatedUser);

      setSessionUser({
        id: updatedUser.id,
        organizationId: updatedUser.organization_id,
        name: updatedUser.full_name,
        role: updatedUser.role,
        email: updatedUser.email,
        initials: makeInitials(updatedUser.full_name),
      });

      setProfileCurrentPassword('');
      setProfileNewPassword('');
      setSuccessMessage('Profile settings saved successfully.');
    } catch (err) {
      setError(parseError(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!canManageOrg) return;

    setOrgSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await settingsService.updateCurrentOrganization({
        name: orgName.trim(),
        description: orgDescription.trim() || null,
        website: orgWebsite.trim() || null,
      });
      setOrganization(updated);
      setSuccessMessage('Organization settings saved successfully.');
    } catch (err) {
      setError(parseError(err));
    } finally {
      setOrgSaving(false);
    }
  };

  const handleToggleIntegration = async (item: IntegrationDto) => {
    if (!canManageOrg) return;

    setIntegrationSavingKey(item.key);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await settingsService.updateIntegration(item.key, {
        enabled: !item.enabled,
        config: item.config,
      });
      setIntegrations(prev => prev.map(entry => (entry.key === item.key ? updated : entry)));
      setSuccessMessage(`${item.key} integration updated.`);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIntegrationSavingKey(null);
    }
  };

  const handleCreateApiKey = async () => {
    if (!canManageOrg || !newKeyName.trim()) {
      setError('API key name is required.');
      return;
    }

    let permissions: Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(newKeyPermissionsText) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        permissions = parsed as Record<string, unknown>;
      } else {
        setError('API key permissions must be a JSON object.');
        return;
      }
    } catch {
      setError('API key permissions must be valid JSON.');
      return;
    }

    setApiKeyCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const created = await settingsService.createApiKey({
        name: newKeyName.trim(),
        permissions,
      });

      setCreatedKey(created);
      setNewKeyName('');
      setSuccessMessage('API key created. Copy it now - it will not be shown again.');
      await loadAll(true);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setApiKeyCreating(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!canManageOrg) return;

    setApiKeyDeleting(id);
    setError(null);
    setSuccessMessage(null);

    try {
      await settingsService.deleteApiKey(id);
      setApiKeys(prev => prev.filter(item => item.id !== id));
      setSuccessMessage('API key deleted successfully.');
    } catch (err) {
      setError(parseError(err));
    } finally {
      setApiKeyDeleting(null);
    }
  };

  const integrationCount = integrations.length;
  const enabledIntegrations = integrations.filter(item => item.enabled).length;

  const profileReadonlyEmail = useMemo(() => user?.email ?? 'N/A', [user]);

  return (
    <div className="p-6 flex flex-col gap-5 min-h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: '#1A1A2E' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: '#717182' }}>
            Manage profile, organization controls, integrations, and API access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(139,60,247,0.08)',
            border: '1px solid rgba(139,60,247,0.2)',
            color: '#8B3CF7',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {(error || successMessage) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} style={{ color: '#EF4444' }} />
              <span className="text-sm" style={{ color: '#B42318' }}>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#047857' }}>
              {successMessage}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Integrations</p>
          <p style={{ color: '#8B3CF7', fontSize: 24, fontWeight: 700 }}>{integrationCount}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>Enabled Integrations</p>
          <p style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>{enabledIntegrations}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
          <p className="text-xs" style={{ color: '#717182' }}>API Keys</p>
          <p style={{ color: '#38BDF8', fontSize: 24, fontWeight: 700 }}>{apiKeys.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl p-5 text-sm" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)', color: '#717182' }}>
          Loading settings...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
            <h2 style={{ color: '#1A1A2E' }}>Profile</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Full name</label>
                <input
                  value={profileName}
                  onChange={event => setProfileName(event.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Email</label>
                <input
                  value={profileReadonlyEmail}
                  disabled
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#EFECFA', border: '1px solid rgba(139,60,247,0.12)', color: '#6E6F86' }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Avatar URL</label>
                <input
                  value={profileAvatar}
                  onChange={event => setProfileAvatar(event.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#717182' }}>Current password</label>
                  <input
                    type="password"
                    value={profileCurrentPassword}
                    onChange={event => setProfileCurrentPassword(event.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: '#717182' }}>New password</label>
                  <input
                    type="password"
                    value={profileNewPassword}
                    onChange={event => setProfileNewPassword(event.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSaveProfile()}
                disabled={profileSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)' }}
              >
                <Save size={14} />
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
            <h2 style={{ color: '#1A1A2E' }}>Organization</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Organization name</label>
                <input
                  value={orgName}
                  onChange={event => setOrgName(event.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Description</label>
                <textarea
                  value={orgDescription}
                  onChange={event => setOrgDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1" style={{ color: '#717182' }}>Website</label>
                <input
                  value={orgWebsite}
                  onChange={event => setOrgWebsite(event.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSaveOrganization()}
                disabled={!canManageOrg || orgSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)', opacity: canManageOrg ? 1 : 0.6 }}
              >
                <Save size={14} />
                {orgSaving ? 'Saving...' : 'Save Organization'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
            <h2 style={{ color: '#1A1A2E' }}>Integrations</h2>
            <div className="mt-4 space-y-2">
              {integrations.length === 0 ? (
                <p className="text-sm" style={{ color: '#717182' }}>No integration records found.</p>
              ) : (
                integrations.map(item => (
                  <div key={item.key} className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: '#F8F5FF' }}>
                    <div>
                      <p className="text-sm" style={{ color: '#1A1A2E' }}>{item.key}</p>
                      <p className="text-xs" style={{ color: '#717182' }}>{item.enabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleToggleIntegration(item)}
                      disabled={!canManageOrg || integrationSavingKey === item.key}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{
                        background: item.enabled ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                        color: item.enabled ? '#EF4444' : '#10B981',
                        border: item.enabled ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
                        opacity: canManageOrg ? 1 : 0.6,
                      }}
                    >
                      {integrationSavingKey === item.key ? 'Saving...' : item.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(139,60,247,0.08)' }}>
            <div className="flex items-center gap-2">
              <KeyRound size={14} style={{ color: '#8B3CF7' }} />
              <h2 style={{ color: '#1A1A2E' }}>API Keys</h2>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-[1fr_160px] gap-2">
                <input
                  value={newKeyName}
                  onChange={event => setNewKeyName(event.target.value)}
                  placeholder="New key name"
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ background: '#F8F5FF', border: '1px solid rgba(139,60,247,0.18)', color: '#1A1A2E' }}
                />
                <button
                  type="button"
                  onClick={() => void handleCreateApiKey()}
                  disabled={!canManageOrg || apiKeyCreating}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #8B3CF7, #38BDF8)', opacity: canManageOrg ? 1 : 0.6 }}
                >
                  <Plus size={13} />
                  {apiKeyCreating ? 'Creating...' : 'Create Key'}
                </button>
              </div>

              <textarea
                value={newKeyPermissionsText}
                onChange={event => setNewKeyPermissionsText(event.target.value)}
                rows={5}
                className="w-full rounded-xl px-3 py-2 text-sm font-mono"
                style={{ background: '#0F0F1A', border: '1px solid rgba(139,60,247,0.22)', color: '#E5E7EB' }}
              />

              {createdKey && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p className="text-xs mb-1" style={{ color: '#047857' }}>Copy this key now (shown once):</p>
                  <div className="flex items-center gap-2">
                    <input
                      value={createdKey.key}
                      readOnly
                      className="flex-1 rounded-lg px-2 py-1 text-xs"
                      style={{ background: '#FFFFFF', border: '1px solid rgba(16,185,129,0.2)', color: '#1A1A2E' }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(createdKey.key);
                        setSuccessMessage('API key copied to clipboard.');
                      }}
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{ background: '#FFFFFF', color: '#047857', border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {apiKeys.length === 0 ? (
                  <p className="text-sm" style={{ color: '#717182' }}>No API keys found.</p>
                ) : (
                  apiKeys.map(item => (
                    <div key={item.id} className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: '#F8F5FF' }}>
                      <div>
                        <p className="text-sm" style={{ color: '#1A1A2E' }}>{item.name}</p>
                        <p className="text-xs" style={{ color: '#717182' }}>
                          Created {new Date(item.created_at).toLocaleDateString()} - last used {item.last_used_at ? new Date(item.last_used_at).toLocaleString() : 'never'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteApiKey(item.id)}
                        disabled={!canManageOrg || apiKeyDeleting === item.id}
                        className="p-2 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', opacity: canManageOrg ? 1 : 0.6 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
