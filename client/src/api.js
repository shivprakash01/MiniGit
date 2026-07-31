const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('minigit_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  // Pages
  getPages: async () => {
    const res = await fetch(`${API_BASE}/pages`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch pages');
    return res.json();
  },

  getPageById: async (id) => {
    const res = await fetch(`${API_BASE}/pages/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch page');
    return res.json();
  },

  createPage: async (pageData) => {
    const res = await fetch(`${API_BASE}/pages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pageData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create page');
    return data;
  },

  createBranch: async (pageId, branchName, sourceBranch) => {
    const res = await fetch(`${API_BASE}/pages/${pageId}/branches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ branchName, sourceBranch }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create branch');
    return data;
  },

  // Versions
  commitVersion: async (versionData) => {
    const res = await fetch(`${API_BASE}/versions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(versionData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to commit version');
    return data;
  },

  getPageVersions: async (pageId) => {
    const res = await fetch(`${API_BASE}/versions/page/${pageId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch version history');
    return res.json();
  },

  compareDiff: async (fromId, toId) => {
    const query = fromId ? `fromId=${fromId}&toId=${toId}` : `toId=${toId}`;
    const res = await fetch(`${API_BASE}/versions/compare/diff?${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to compute diff');
    return res.json();
  },

  getBlame: async (versionId) => {
    const res = await fetch(`${API_BASE}/versions/${versionId}/blame`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch blame');
    return res.json();
  },

  // Merge
  previewMerge: async (pageId, sourceBranch, targetBranch) => {
    const res = await fetch(`${API_BASE}/merge/preview`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pageId, sourceBranch, targetBranch }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to preview merge');
    return data;
  },

  executeMerge: async (mergeData) => {
    const res = await fetch(`${API_BASE}/merge/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(mergeData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to execute merge');
    return data;
  },

  // Admin
  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch admin users');
    return res.json();
  },

  updateUserRole: async (userId, role) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update user role');
    return data;
  },

  getAdminStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  updateBranchProtection: async (pageId, protectedBranches) => {
    const res = await fetch(`${API_BASE}/admin/pages/${pageId}/protection`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ protectedBranches }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update protection');
    return data;
  },

  // MiniGit Engine Repositories API
  initRepo: async (name, description) => {
    const res = await fetch(`${API_BASE}/repos/init`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to init repository');
    return data;
  },

  listRepos: async () => {
    const res = await fetch(`${API_BASE}/repos`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch repositories');
    return res.json();
  },

  getRepo: async (repoId) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch repository details');
    return res.json();
  },

  saveWorkingFile: async (repoId, filename, content) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}/file`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ filename, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save working file');
    return data;
  },

  getWorkingFiles: async (repoId) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}/files`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch working directory files');
    return res.json();
  },

  getFileContent: async (repoId, filename, hash) => {
    const query = hash ? `hash=${hash}` : `filename=${encodeURIComponent(filename)}`;
    const res = await fetch(`${API_BASE}/repos/${repoId}/file-content?${query}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch file content');
    return res.json();
  },

  addFile: async (repoId, filename, content) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}/add`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ filename, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to stage file');
    return data;
  },

  getStatus: async (repoId) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}/status`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch repository status');
    return res.json();
  },

  createCommit: async (repoId, message) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}/commit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create commit');
    return data;
  },

  getLog: async (repoId) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}/log`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch commit logs');
    return res.json();
  },

  checkoutCommit: async (repoId, commitId) => {
    const res = await fetch(`${API_BASE}/repos/${repoId}/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ commitId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to checkout commit');
    return data;
  },
};
