import { useState } from 'react';
import useSWR from 'swr';
import { type AdminApiKey, type CreateApiKeyData, createApiKey, deleteApiKey, getApiKeys } from '@/api/admin/apiKeys';
import { httpErrorToHuman } from '@/api/http';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';

const AdminApiContainer = () => {
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [memo, setMemo] = useState('');
    const [allowedIps, setAllowedIps] = useState('');
    const [creating, setCreating] = useState(false);
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const { data, error, mutate } = useSWR(['admin:api-keys', page], () => getApiKeys({ page }));

    const handleCreate = async () => {
        if (!memo.trim()) return;
        setCreating(true);
        try {
            const payload: CreateApiKeyData = {
                memo: memo.trim(),
                allowedIps: allowedIps
                    ? allowedIps
                          .split(',')
                          .map((ip) => ip.trim())
                          .filter(Boolean)
                    : null,
            };
            const result = await createApiKey(payload);
            setCreatedToken(result.token);
            setMemo('');
            setAllowedIps('');
            setShowCreate(false);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
        try {
            await deleteApiKey(id);
            mutate();
        } catch (e: any) {
            alert(httpErrorToHuman(e));
        }
    };

    const handleCopyToken = () => {
        if (createdToken) {
            navigator.clipboard.writeText(createdToken);
        }
    };

    return (
        <div>
            <MainPageHeader title='API Keys'>
                <button
                    onClick={() => {
                        setShowCreate(!showCreate);
                        setCreatedToken(null);
                    }}
                    className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 text-cream-400 text-sm rounded transition-colors'
                >
                    Create API Key
                </button>
            </MainPageHeader>

            {error && <div className='text-red-400 mb-4'>Error: {httpErrorToHuman(error)}</div>}

            {createdToken && (
                <div className='bg-mocha-500 border border-yellow-800 rounded-lg p-4 mb-4'>
                    <div className='flex items-start justify-between'>
                        <div>
                            <p className='text-yellow-400 font-medium text-sm mb-1'>
                                API Key Created — Copy This Token Now
                            </p>
                            <p className='text-mocha-200 text-xs mb-3'>
                                This token will not be shown again. Store it securely.
                            </p>
                            <code className='block bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 break-all font-mono'>
                                {createdToken}
                            </code>
                        </div>
                        <button
                            onClick={handleCopyToken}
                            className='ml-4 px-3 py-2 bg-mocha-400 hover:bg-mocha-300 text-mocha-100 text-sm rounded transition-colors whitespace-nowrap'
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}

            {showCreate && !createdToken && (
                <div className='bg-mocha-500 border border-mocha-400 rounded-lg p-4 mb-4'>
                    <h3 className='text-sm font-medium text-cream-400 mb-3'>New API Key</h3>
                    <div className='space-y-3'>
                        <div>
                            <label className='block text-xs text-mocha-200 mb-1'>Memo</label>
                            <input
                                type='text'
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                placeholder='e.g. Production server key'
                                className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 placeholder-mocha-200/40 focus:outline-none focus:border-mocha-400'
                            />
                        </div>
                        <div>
                            <label className='block text-xs text-mocha-200 mb-1'>Allowed IPs (comma-separated)</label>
                            <textarea
                                value={allowedIps}
                                onChange={(e) => setAllowedIps(e.target.value)}
                                placeholder='e.g. 192.168.1.1, 10.0.0.1'
                                rows={2}
                                className='w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 placeholder-mocha-200/40 focus:outline-none focus:border-mocha-400 resize-none'
                            />
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={handleCreate}
                                disabled={!memo.trim() || creating}
                                className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 disabled:opacity-50 disabled:cursor-not-allowed text-cream-400 text-sm rounded transition-colors'
                            >
                                {creating ? 'Creating...' : 'Create Key'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreate(false);
                                    setMemo('');
                                    setAllowedIps('');
                                }}
                                className='px-4 py-2 bg-mocha-400 hover:bg-mocha-300 text-mocha-100 text-sm rounded transition-colors'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!data ? (
                <Spinner />
            ) : (
                <Pagination data={data} onPageSelect={setPage}>
                    {({ items }) => (
                        <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b border-mocha-400'>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Identifier</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Memo</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Allowed IPs</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Last Used</th>
                                        <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Created</th>
                                        <th className='text-right px-4 py-3 text-mocha-200 font-medium'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className='text-center py-8 text-mocha-200'>
                                                No API keys found.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((apiKey: AdminApiKey) => (
                                            <tr
                                                key={apiKey.id}
                                                className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                            >
                                                <td className='px-4 py-3 text-cream-400 font-mono text-xs'>
                                                    {apiKey.identifier}
                                                </td>
                                                <td className='px-4 py-3 text-mocha-100'>{apiKey.memo || '—'}</td>
                                                <td className='px-4 py-3 text-mocha-200 text-xs'>
                                                    {apiKey.allowedIps ? (
                                                        apiKey.allowedIps.join(', ')
                                                    ) : (
                                                        <span className='text-mocha-200/60'>Any</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-mocha-200 text-xs'>
                                                    {apiKey.lastUsedAt ? (
                                                        new Date(apiKey.lastUsedAt).toLocaleDateString()
                                                    ) : (
                                                        <span className='text-mocha-200/60'>Never</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-mocha-200 text-xs'>
                                                    {new Date(apiKey.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className='px-4 py-3 text-right'>
                                                    <button
                                                        onClick={() => handleDelete(apiKey.id)}
                                                        className='text-xs text-red-400 hover:text-red-300'
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Pagination>
            )}
        </div>
    );
};

export default AdminApiContainer;
