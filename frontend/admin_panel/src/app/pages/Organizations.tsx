import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, MoreVertical } from 'lucide-react';
import { GlowCard } from '../components/GlowCard';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { adminService } from '../api/services/adminService';
import type { AdminAPIRequestItem, AdminOrganizationItem } from '../api/types/admin';
import { toRelativeTime } from '../utils/formatters';

const PAGE_SIZE = 25;

export function Organizations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<AdminOrganizationItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<AdminOrganizationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [orgRequests, setOrgRequests] = useState<AdminAPIRequestItem[]>([]);

  const loadOrganizations = async (nextOffset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listOrganizations({
        limit: PAGE_SIZE,
        offset: nextOffset,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : (statusFilter as 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'DISABLED'),
      });
      setOrganizations(data.items);
      setTotal(data.total);
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrganizations(0);
  }, [statusFilter]);

  const openOrganization = async (org: AdminOrganizationItem) => {
    setSelectedOrg(org);
    try {
      const data = await adminService.apiMonitoringRequests({
        organization_id: org.id,
        limit: 8,
        offset: 0,
      });
      setOrgRequests(data.items);
    } catch {
      setOrgRequests([]);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const getHealthColor = (status: string) => {
    if (status === 'ACTIVE') return 'bg-green-500/10 border-green-500/20 text-green-400';
    if (status === 'TRIAL') return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    return 'bg-red-500/10 border-red-500/20 text-red-400';
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-400';
    if (score < 60) return 'text-yellow-400';
    if (score < 80) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organization Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage customer organizations across the Trusyn platform</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#8B3CF7] to-[#38BDF8]"
          onClick={() => void loadOrganizations(offset)}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <GlowCard glow glowColor="purple">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void loadOrganizations(0);
                }
              }}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="TRIAL">Trial</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="DISABLED">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void loadOrganizations(0)}>
            Apply Filters
          </Button>
        </div>
      </GlowCard>

      <GlowCard glow glowColor="gradient">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Organization</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Active Agents</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Risk Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Threats (24h)</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org, index) => (
                <motion.tr
                  key={org.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => void openOrganization(org)}
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.slug}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="secondary">{org.active_agents_count} agents</Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-sm font-bold ${getRiskColor(org.avg_risk_24h)}`}>{org.avg_risk_24h.toFixed(1)}</span>
                  </td>
                  <td className="py-4 px-4 text-sm capitalize">{org.plan}</td>
                  <td className="py-4 px-4 text-sm">{org.threats_24h_count}</td>
                  <td className="py-4 px-4">
                    <Badge className={`${getHealthColor(org.status)} capitalize`}>
                      {org.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {organizations.length === 0 && !loading && (
          <div className="text-center py-10 text-sm text-muted-foreground">No organizations found for the selected filters.</div>
        )}

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} ({total} organizations)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => void loadOrganizations(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => void loadOrganizations(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      </GlowCard>

      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-elevated">
          <DialogHeader>
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
            <DialogDescription>Organization telemetry and runtime activity overview</DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Users</p>
                  <p className="text-2xl font-bold">{selectedOrg.users_count}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Active Agents</p>
                  <p className="text-2xl font-bold">{selectedOrg.active_agents_count}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Active Policies</p>
                  <p className="text-2xl font-bold">{selectedOrg.policies_enabled_count}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Avg Risk (24h)</p>
                  <p className={`text-2xl font-bold ${getRiskColor(selectedOrg.avg_risk_24h)}`}>
                    {selectedOrg.avg_risk_24h.toFixed(1)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Recent API Monitoring Events</h3>
                <div className="space-y-2">
                  {orgRequests.map((request) => (
                    <div key={request.id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{request.agent_name ?? 'Unknown agent'}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.endpoint} - {toRelativeTime(request.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={request.status === 'success' ? 'default' : 'destructive'} className="capitalize">
                          {request.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{request.latency_ms}ms</p>
                      </div>
                    </div>
                  ))}
                  {orgRequests.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent request telemetry for this organization.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
