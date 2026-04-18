/**
 * SSRF Guard Tests
 *
 * Verifies the shared `isSafeExternalUrl` helper that is used by the
 * webhook dispatcher and the RSS import route to reject outbound
 * requests to internal / loopback / link-local / cloud-metadata hosts.
 *
 * Without this guard, a user could register a webhook URL of
 * `http://localhost:3001/api/admin` or an RSS feed URL of
 * `http://169.254.169.254/latest/meta-data/iam/security-credentials/`
 * and trick the server into fetching private resources.
 *
 * If this file fails to import `isSafeExternalUrl`, the helper hasn't
 * been created yet — the Healer will add it.
 */
import { describe, it, expect } from 'vitest';
import { isSafeExternalUrl } from '@/lib/security/ssrf-guard';

describe('isSafeExternalUrl', () => {
  describe('allowlisted — returns true', () => {
    it('allows plain https URLs', () => {
      expect(isSafeExternalUrl('https://example.com/feed.xml')).toBe(true);
    });

    it('allows plain http URLs', () => {
      expect(isSafeExternalUrl('http://example.com/feed.xml')).toBe(true);
    });

    it('allows subdomains and paths', () => {
      expect(isSafeExternalUrl('https://cdn.example.com/path?q=1')).toBe(true);
    });

    it('allows a public IP (8.8.8.8)', () => {
      expect(isSafeExternalUrl('http://8.8.8.8/')).toBe(true);
    });
  });

  describe('blocklisted — returns false', () => {
    it('blocks localhost by name', () => {
      expect(isSafeExternalUrl('http://localhost/admin')).toBe(false);
      expect(isSafeExternalUrl('http://localhost:3000/')).toBe(false);
      expect(isSafeExternalUrl('https://LOCALHOST/x')).toBe(false);
    });

    it('blocks 127.0.0.0/8 loopback', () => {
      expect(isSafeExternalUrl('http://127.0.0.1/')).toBe(false);
      expect(isSafeExternalUrl('http://127.0.0.1:8080/x')).toBe(false);
      expect(isSafeExternalUrl('http://127.1.2.3/')).toBe(false);
    });

    it('blocks ipv6 loopback', () => {
      expect(isSafeExternalUrl('http://[::1]/')).toBe(false);
      expect(isSafeExternalUrl('http://[0:0:0:0:0:0:0:1]/')).toBe(false);
    });

    it('blocks AWS IMDS (169.254.169.254)', () => {
      expect(isSafeExternalUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    });

    it('blocks link-local 169.254.0.0/16', () => {
      expect(isSafeExternalUrl('http://169.254.1.2/')).toBe(false);
    });

    it('blocks 10.0.0.0/8', () => {
      expect(isSafeExternalUrl('http://10.0.0.1/')).toBe(false);
      expect(isSafeExternalUrl('http://10.255.255.254/')).toBe(false);
    });

    it('blocks 172.16.0.0/12', () => {
      expect(isSafeExternalUrl('http://172.16.0.1/')).toBe(false);
      expect(isSafeExternalUrl('http://172.31.255.254/')).toBe(false);
    });

    it('does NOT block 172.15.x.x or 172.32.x.x (outside RFC1918 range)', () => {
      expect(isSafeExternalUrl('http://172.15.0.1/')).toBe(true);
      expect(isSafeExternalUrl('http://172.32.0.1/')).toBe(true);
    });

    it('blocks 192.168.0.0/16', () => {
      expect(isSafeExternalUrl('http://192.168.1.1/')).toBe(false);
    });

    it('blocks 0.0.0.0', () => {
      expect(isSafeExternalUrl('http://0.0.0.0/')).toBe(false);
    });

    it('rejects non-http(s) schemes', () => {
      expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeExternalUrl('gopher://example.com/')).toBe(false);
      expect(isSafeExternalUrl('ftp://example.com/')).toBe(false);
      expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects malformed URLs', () => {
      expect(isSafeExternalUrl('not-a-url')).toBe(false);
      expect(isSafeExternalUrl('')).toBe(false);
      expect(isSafeExternalUrl('http://')).toBe(false);
    });

    it('is safe against IP-encoding tricks', () => {
      // Decimal-encoded 127.0.0.1 (2130706433 = 0x7F000001)
      // Note: Node URL parser normalizes these to a hostname string but
      // does NOT automatically resolve. The guard should treat unparseable
      // hosts as unsafe.
      expect(isSafeExternalUrl('http://2130706433/')).toBe(false);
      // Hex-encoded localhost
      expect(isSafeExternalUrl('http://0x7f000001/')).toBe(false);
    });
  });
});
