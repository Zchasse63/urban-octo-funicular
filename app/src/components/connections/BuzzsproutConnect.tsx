'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
    } catch (error) {
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
      <div className="animate-pulse rounded-lg border bg-white p-6 shadow-sm">
        <div className="h-6 w-48 rounded bg-gray-200"></div>
      </div>
    );
  }

  if (connection) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Buzzsprout</h3>
            <div className="mt-1 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Connected
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="rounded-lg border border-red-500 px-4 py-2 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Connected on {new Date(connection.created_at).toLocaleDateString()}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Connect Buzzsprout
      </h3>

      <form onSubmit={handleConnect} className="space-y-4">
        <div>
          <label
            htmlFor="apiToken"
            className="block text-sm font-medium text-gray-700"
          >
            API Token <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="apiToken"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Enter your Buzzsprout API token"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Find your API token in your Buzzsprout account settings
          </p>
        </div>

        <div>
          <label
            htmlFor="showId"
            className="block text-sm font-medium text-gray-700"
          >
            Show ID (Optional)
          </label>
          <input
            type="text"
            id="showId"
            value={showId}
            onChange={(e) => setShowId(e.target.value)}
            placeholder="Enter show ID (optional)"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </form>
    </div>
  );
}
