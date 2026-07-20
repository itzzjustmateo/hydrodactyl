import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { InformationCircleIcon, SlidersHorizontalIcon, CodeIcon, Settings02Icon, EggsIcon } from '@hugeicons/core-free-icons';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/elements/dialog';
import { getEgg, updateEgg, deleteEgg, type AdminEgg } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminEggVariablesContainer from '@/components/admin/nests/AdminEggVariablesContainer';
import AdminEggScriptsContainer from '@/components/admin/nests/AdminEggScriptsContainer';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminEggViewContainer = () => {
    const { id: nestIdParam, eggId: eggIdParam } = useParams<{ id: string; eggId: string }>();
    const navigate = useNavigate();
    const nestId = Number(nestIdParam);
    const eggId = Number(eggIdParam);
    const [activeTab, setActiveTab] = useState<'configuration' | 'variables' | 'scripts' | 'manage'>('configuration');
    const [editing, setEditing] = useState(false);
    const [formInit, setFormInit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startup, setStartup] = useState('');
    const [dockerImages, setDockerImages] = useState('');
    const [forceOutgoingIp, setForceOutgoingIp] = useState(false);
    const [features, setFeatures] = useState('');
    const [configFrom, setConfigFrom] = useState<number | null>(null);
    const [configStop, setConfigStop] = useState('');
    const [configStartup, setConfigStartup] = useState('');
    const [configLogs, setConfigLogs] = useState('');
    const [configFiles, setConfigFiles] = useState('');

    const { data: egg, error: fetchError, mutate } = useSWR(
        eggId ? ['admin:egg', nestId, eggId] : null,
        () => getEgg(nestId, eggId),
    );

    useEffect(() => {
        if (egg && !formInit) {
            setName(egg.name);
            setDescription(egg.description || '');
            setStartup(egg.startup || '');
            setDockerImages(Object.entries(egg.dockerImages || {}).map(([k, v]) => `${k}|${v}`).join('\n'));
            setForceOutgoingIp(egg.forceOutgoingIp || false);
            setFeatures((egg.features || []).join(', '));
            setConfigFrom(egg.config.extends);
            setConfigStop(egg.config.stop || '');
            setConfigStartup(egg.config.startup || '');
            setConfigLogs(egg.config.logs || '');
            setConfigFiles(egg.config.files ? JSON.stringify(egg.config.files, null, 2) : '');
            setFormInit(true);
        }
    }, [egg, formInit]);

    const syncFromEgg = () => {
        if (!egg) return;
        setName(egg.name);
        setDescription(egg.description || '');
        setStartup(egg.startup || '');
        setDockerImages(Object.entries(egg.dockerImages || {}).map(([k, v]) => `${k}|${v}`).join('\n'));
        setForceOutgoingIp(egg.forceOutgoingIp || false);
        setFeatures((egg.features || []).join(', '));
        setConfigFrom(egg.config.extends);
        setConfigStop(egg.config.stop || '');
        setConfigStartup(egg.config.startup || '');
        setConfigLogs(egg.config.logs || '');
        setConfigFiles(egg.config.files ? JSON.stringify(egg.config.files, null, 2) : '');
    };

    const handleSave = async () => {
        setSaving(true);

        const images: Record<string, string> = {};
        dockerImages.split('\n').filter(Boolean).forEach((line) => {
            const [key, ...rest] = line.split('|');
            if (key) {
                images[key.trim()] = rest.join('|').trim() || key.trim();
            }
        });

        const data: Record<string, unknown> = {
            name,
            description: description || null,
            startup,
            docker_images: images,
            force_outgoing_ip: forceOutgoingIp,
            features: features ? features.split(',').map((f) => f.trim()).filter(Boolean) : null,
            config_from: configFrom,
            config_stop: configStop || null,
            config_startup: configStartup || null,
            config_logs: configLogs || null,
        };

        let filesParsed: Record<string, unknown> | null = null;
        if (configFiles.trim()) {
            try { filesParsed = JSON.parse(configFiles); } catch { /* ignore */ }
        }
        if (filesParsed) {
            data.config_files = JSON.stringify(filesParsed);
        }

        try {
            await updateEgg(nestId, eggId, data);
            await mutate();
            setEditing(false);
            toast.success('Egg saved successfully');
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        try {
            await deleteEgg(nestId, eggId);
            toast.success('Egg deleted successfully');
            navigate(`/admin/nests/${nestId}`);
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = () => {
        if (!egg) return;
        const blob = new Blob([JSON.stringify(egg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${egg.name}.egg.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (fetchError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(fetchError)}</div>;
    if (!egg) return <Spinner />;

    const dockerImageCount = Object.keys(egg.dockerImages || {}).length;

    const createdAge = (() => {
        const created = new Date(egg.createdAt);
        const now = new Date();
        const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (days < 1) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        if (months === 1) return '1 month ago';
        if (months < 12) return `${months} months ago`;
        const years = Math.floor(months / 12);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    })();

    return (
        <div>
            {/* ── Header ── */}
            <div className='flex items-center justify-between gap-4 mb-6 mt-8 md:mt-0 flex-col sm:flex-row'>
                <div className='flex items-center gap-3'>
                    <Link to={`/admin/nests/${nestId}`} className='text-sm text-mocha-200 hover:text-cream-400 transition-colors'>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                        </svg>
                    </Link>
                    <h1 className='text-2xl font-bold text-cream-400'>{egg.name}</h1>
                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-mocha-400/50 text-mocha-200 border border-mocha-400/50'>
                        {egg.author}
                    </span>
                    <Link
                        to={`/admin/nests/${nestId}`}
                        className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand/10 text-cream-400 border border-brand/20 hover:bg-brand/20 transition-colors'
                    >
                        Nest #{nestId}
                    </Link>
                </div>
                <div className='flex items-center gap-3'>
                    {activeTab === 'configuration' && editing && (
                        <Button variant='default' onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                    <Button variant='secondary' onClick={handleExport}>
                        Export
                    </Button>
                    <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                        Delete Egg
                    </Button>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className='flex items-center gap-2 p-1 bg-mocha-500/50 border border-mocha-400/50 rounded-xl w-fit mt-4'>
                {([
                    { key: 'configuration', label: 'Configuration', icon: InformationCircleIcon },
                    { key: 'variables', label: 'Variables', icon: SlidersHorizontalIcon },
                    { key: 'scripts', label: 'Install Script', icon: CodeIcon },
                    { key: 'manage', label: 'Manage', icon: Settings02Icon },
                ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === key
                                ? 'bg-mocha-400 text-cream-400 shadow-sm'
                                : 'text-mocha-200 hover:text-cream-400 hover:bg-mocha-400/30'
                        }`}
                    >
                        <HugeiconsIcon icon={Icon} className='w-4 h-4' />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <div className='mt-4'>
                {/* ── Configuration Tab ── */}
                {activeTab === 'configuration' && (
                    <div className='space-y-6'>
                        {/* Profile Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                                <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                                    <HugeiconsIcon icon={EggsIcon} className='w-8 h-8 text-cream-400' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-cream-400 font-medium text-lg'>{egg.name}</p>
                                    {egg.description && (
                                        <p className='text-mocha-200 text-sm mt-0.5'>{egg.description}</p>
                                    )}
                                </div>
                                <div className='flex items-center gap-3'>
                                    <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                        <p className='text-2xl font-bold text-cream-400'>{dockerImageCount}</p>
                                        <p className='text-xs text-mocha-200'>Images</p>
                                    </div>
                                    {egg.features && egg.features.length > 0 && (
                                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                            <p className='text-2xl font-bold text-cream-400'>{egg.features.length}</p>
                                            <p className='text-xs text-mocha-200'>Features</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Basic Settings Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                        <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className='text-cream-400 font-semibold text-lg'>Basic Settings</h3>
                                        <p className='text-mocha-200 text-sm'>Core egg configuration and identification</p>
                                    </div>
                                </div>
                                {!editing && (
                                    <Button variant='secondary' onClick={() => setEditing(true)}>
                                        Edit Configuration
                                    </Button>
                                )}
                            </div>

                            {editing ? (
                                <div className='space-y-5'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                                        <div>
                                            <label className={labelClass}>Egg Name *</label>
                                            <input value={name} onChange={(e) => setName(e.target.value)}
                                                className={inputClass} placeholder='My Egg' />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Features (comma-separated)</label>
                                            <input value={features} onChange={(e) => setFeatures(e.target.value)}
                                                placeholder='e.g. eula, auto_update'
                                                className={inputClass} />
                                            <p className='text-mocha-200 text-xs mt-1.5'>Common: eula, auto_update, force_update</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Description</label>
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                            className={inputClass} rows={3} placeholder='Optional description for this egg' />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Startup Command *</label>
                                        <textarea value={startup} onChange={(e) => setStartup(e.target.value)}
                                            className={inputClass + ' font-mono text-xs'} rows={4}
                                            placeholder='{"{{SERVER_JAVA}}" {{SERVER_JAVA_FLAGS}} -jar {{SERVER_JAR}}}' />
                                        <p className='text-mocha-200 text-xs mt-1.5'>Use variables like {'{{SERVER_JAVA}}'}, {'{{SERVER_JAR}}'}, etc.</p>
                                    </div>

                                    <div className='flex items-center gap-2'>
                                        <input type='checkbox' id='forceIp' checked={forceOutgoingIp}
                                            onChange={(e) => setForceOutgoingIp(e.target.checked)}
                                            className='rounded border-mocha-400 w-4 h-4' />
                                        <label htmlFor='forceIp' className='text-sm text-cream-400 cursor-pointer'>Force Outgoing IP</label>
                                    </div>

                                    <div className='flex items-center gap-3 pt-2'>
                                        <Button variant='default' onClick={handleSave} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            variant='secondary'
                                            onClick={() => {
                                                syncFromEgg();
                                                setEditing(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Egg ID</span>
                                            <p className='text-cream-400 font-medium mt-1'>{egg.id}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>UUID</span>
                                            <p className='text-cream-400 font-mono text-sm mt-1 truncate' title={egg.uuid}>
                                                {egg.uuid}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Author</span>
                                            <p className='text-cream-400 text-sm mt-1'>{egg.author}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Name</span>
                                            <p className='text-cream-400 font-medium mt-1'>{egg.name}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Description</span>
                                            <p className='text-cream-400 text-sm mt-1'>{egg.description || <span className='text-mocha-200/60'>None</span>}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Docker Images</span>
                                            <p className='text-cream-400 font-medium mt-1'>{dockerImageCount}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Features</span>
                                            <p className='text-cream-400 text-sm mt-1'>
                                                {egg.features && egg.features.length > 0
                                                    ? egg.features.join(', ')
                                                    : <span className='text-mocha-200/60'>None</span>}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Force Outgoing IP</span>
                                            <p className='text-cream-400 text-sm mt-1'>{egg.forceOutgoingIp ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Created</span>
                                            <p className='text-cream-400 text-sm mt-1' title={egg.createdAt}>{createdAge}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Last Updated</span>
                                            <p className='text-cream-400 text-sm mt-1' title={egg.updatedAt}>
                                                {egg.updatedAt ? new Date(egg.updatedAt).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Docker Images Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Docker Images</h3>
                                    <p className='text-mocha-200 text-sm'>Container images available for this egg</p>
                                </div>
                            </div>

                            {editing ? (
                                <div>
                                    <label className={labelClass}>Image Definitions</label>
                                    <textarea value={dockerImages} onChange={(e) => setDockerImages(e.target.value)}
                                        className={inputClass + ' font-mono text-xs'} rows={6}
                                        placeholder='java|ghcr.io/pterodactyl/yolks:java_17' />
                                    <p className='text-mocha-200 text-xs mt-1.5'>Format: key|image (one per line). Example: <code className='text-cream-400'>java|ghcr.io/pterodactyl/yolks:java_17</code></p>
                                </div>
                            ) : (
                                <div className='space-y-2'>
                                    {Object.entries(egg.dockerImages || {}).map(([key, value]) => (
                                        <div key={key} className='flex items-center gap-3 bg-mocha-600/50 rounded-lg p-3'>
                                            <code className='text-cream-400 text-sm font-medium min-w-[80px]'>{key}</code>
                                            <span className='text-mocha-200/40'>→</span>
                                            <code className='text-mocha-200 text-xs font-mono break-all'>{value}</code>
                                        </div>
                                    ))}
                                    {Object.keys(egg.dockerImages || {}).length === 0 && (
                                        <p className='text-mocha-200/60 text-sm'>No docker images configured.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Process Management Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Process Management</h3>
                                    <p className='text-mocha-200 text-sm'>Server lifecycle and configuration</p>
                                </div>
                            </div>

                            {editing ? (
                                <div className='space-y-4'>
                                    <div>
                                        <label className={labelClass}>Copy Settings From (Egg ID)</label>
                                        <input type='number' value={configFrom ?? ''}
                                            onChange={(e) => setConfigFrom(e.target.value ? Number(e.target.value) : null)}
                                            className={inputClass} placeholder='Leave empty to use default settings' />
                                        <p className='text-mocha-200 text-xs mt-1.5'>Inherit configuration from another egg</p>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Stop Command</label>
                                        <input value={configStop} onChange={(e) => setConfigStop(e.target.value)}
                                            className={inputClass + ' font-mono text-xs'}
                                            placeholder='{{SERVER_JAVA}} {{SERVER_JAVA_FLAGS}} -jar {{SERVER_JAR}}' />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Startup Configuration (JSON)</label>
                                        <textarea value={configStartup} onChange={(e) => setConfigStartup(e.target.value)}
                                            className={inputClass + ' font-mono text-xs'} rows={4}
                                            placeholder='{"done": "Server started successfully"}' />
                                        <p className='text-mocha-200 text-xs mt-1.5'>Regex patterns to detect when server is ready</p>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Log Configuration (JSON)</label>
                                        <textarea value={configLogs} onChange={(e) => setConfigLogs(e.target.value)}
                                            className={inputClass + ' font-mono text-xs'} rows={4}
                                            placeholder='{"prefix": "\\u001b[32m\\[Server\\]"}' />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Configuration Files (JSON)</label>
                                        <textarea value={configFiles} onChange={(e) => setConfigFiles(e.target.value)}
                                            className={inputClass + ' font-mono text-xs'} rows={5}
                                            placeholder='{"server.properties": {"match": "//", "replace": "..."}}' />
                                        <p className='text-mocha-200 text-xs mt-1.5'>Define files that should be created/updated on server</p>
                                    </div>
                                </div>
                            ) : (
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Copy From</span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.extends ? `Egg #${egg.config.extends}` : <span className='text-mocha-200/60'>None</span>}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Stop Command</span>
                                        <p className='text-cream-400 font-mono text-xs mt-1 truncate' title={egg.config.stop || ''}>
                                            {egg.config.stop || <span className='text-mocha-200/60'>Default</span>}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Startup Config</span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.startup ? 'Configured' : <span className='text-mocha-200/60'>None</span>}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Log Config</span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.logs ? 'Configured' : <span className='text-mocha-200/60'>None</span>}
                                        </p>
                                    </div>
                                    <div className='bg-mocha-600/50 rounded-lg p-4'>
                                        <span className='text-mocha-200 text-xs uppercase tracking-wider'>Config Files</span>
                                        <p className='text-cream-400 text-sm mt-1'>
                                            {egg.config.files ? 'Defined' : <span className='text-mocha-200/60'>None</span>}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Startup Command Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={CodeIcon} className='w-5 h-5 text-cream-400' />
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Startup Command</h3>
                                    <p className='text-mocha-200 text-sm'>Default command used to start servers</p>
                                </div>
                            </div>
                            {editing ? null : (
                                <pre className='bg-mocha-600/50 rounded-lg p-4 text-xs font-mono text-cream-400 overflow-x-auto whitespace-pre-wrap break-all'>
                                    {egg.startup || 'No startup command configured.'}
                                </pre>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Variables Tab ── */}
                {activeTab === 'variables' && (
                    <AdminEggVariablesContainer nestId={nestId} eggId={eggId} />
                )}

                {/* ── Install Script Tab ── */}
                {activeTab === 'scripts' && (
                    <AdminEggScriptsContainer nestId={nestId} eggId={eggId} />
                )}

                {/* ── Manage Tab ── */}
                {activeTab === 'manage' && (
                    <div className='space-y-6'>
                        <div className='bg-mocha-500 border-2 border-red-800/50 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-4'>
                                <div className='w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center'>
                                    <svg className='w-5 h-5 text-red-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-red-400 font-semibold text-lg'>Danger Zone</h3>
                                    <p className='text-mocha-200 text-sm'>Irreversible actions</p>
                                </div>
                            </div>

                            <p className='text-sm text-mocha-200 mb-4'>
                                Permanently delete this egg. Any servers using this egg will not be affected, but they will no longer be able to be reinstalled. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete Egg'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete Egg'
                confirm='Delete'
            >
                Are you sure you want to permanently delete egg <strong>{egg.name}</strong>? This action cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

export default AdminEggViewContainer;
