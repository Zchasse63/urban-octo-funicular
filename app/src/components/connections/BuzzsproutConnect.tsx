'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Connection {
  id: string;
  status: string;
  created_at: string;
}

export function BuzzsproutConnect() {
  const [apiToken, setApiToken] = useState('');
  const [showId, setShowId] = useState('');
  const [loading, setLoading] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/buzzsprout/podcasts');
      if (response.ok) {
        setConnection({
          id: 'existing',
          status: 'active',
          created_at: new Date().toISOString(),
        });
      } else if (response.status === 404) {
        // 404 = no connection exists (expected for new users)
        setConnection(null);
      } else {
        // 500/other = server/network error (don't assume no connection)
        // Still set to null to allow connection attempt
        setConnection(null);
      }
    } catch {
      // Network error - distinguish from missing connection
      // Set to null to allow user to attempt connection
      setConnection(null);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiToken.trim()) {
      toast.error('Please enter your Buzzsprout API token');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/buzzsprout/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_token: apiToken,
          show_id: showId || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnection({
          id: data.id,
          status: 'active',
          created_at: new Date().toISOString(),
        });
        setApiToken('');
        setShowId('');
        toast.success('Successfully connected to Buzzsprout');
      } else {
        toast.error(data.error || 'Unable to connect to Buzzsprout. Please check your API token.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Buzzsprout?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/buzzsprout/connect', {
        method: 'DELETE',
      });

      if (response.ok) {
        setConnection(null);
        toast.success('Successfully disconnected from Buzzsprout');
      } else {
        toast.error('Failed to disconnect. Please try again.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-6 w-48 rounded bg-[var(--bg-subtle)]" />
        </CardContent>
      </Card>
    );
  }

  if (connection) {
    return (
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-lg normal-case tracking-normal">Buzzsprout</CardTitle>
            <Badge variant="success" className="mt-2">Connected</Badge>
          </div>
          <Button
            onClick={handleDisconnect}
            disabled={loading}
            type="button"
            variant="outline"
            className="border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[rgba(239,68,68,0.08)]"
          >
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">
            Connected on {new Date(connection.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg normal-case tracking-normal">Connect Buzzsprout</CardTitle>
      </CardHeader>
      <CardContent>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label
              htmlFor="apiToken"
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              API Token <span className="text-[var(--accent-red)]">*</span>
            </label>
            <Input
              type="password"
              id="apiToken"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your Buzzsprout API token"
              className="mt-1"
              required
            />
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Find your API token in your Buzzsprout account settings
            </p>
          </div>

          <div>
            <label
              htmlFor="showId"
              className="block text-sm font-medium text-[var(--text-secondary)]"
            >
              Show ID (Optional)
            </label>
            <Input
              type="text"
              id="showId"
              value={showId}
              onChange={(e) => setShowId(e.target.value)}
              placeholder="Enter show ID (optional)"
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
