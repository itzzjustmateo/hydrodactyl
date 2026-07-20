import { useEffect, useState } from 'react';
import { Link, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { InformationCircleIcon, EggsIcon, Settings02Icon, CubeIcon } from '@hugeicons/core-free-icons';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import Spinner from '@/components/elements/Spinner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/elements/dialog';
import { getNest, updateNest, deleteNest, getNestEggs, deleteEgg, type AdminEgg } from '@/api/admin/nests';
import { httpErrorToHuman } from '@/api/http';
import AdminEggViewContainer from '@/components/admin/nests/AdminEggViewContainer';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdminNestView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const nestId = Number(id);
    const [activeTab, setActiveTab] = useState<'details' | 'eggs' | 'manage'>('details');
    const [editing, setEditing] = useState(false);
    const [formInit, setFormInit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const { data: nest, error: fetchError, mutate } = useSWR(
        nestId ? ['admin:nest', nestId] : null,
        () => getNest(nestId),
    );

    const { data: eggsData, error: eggsError } = useSWR(
        nestId ? ['admin:nest:eggs', nestId] : null,
        () => getNestEggs(nestId),
    );

    useEffect(() => {
        if (nest && !formInit) {
            setName(nest.name);
            setDescription(nest.description || '');
            setFormInit(true);
        }
    }, [nest, formInit]);

    const syncFromNest = () => {
        if (!nest) return;
        setName(nest.name);
        setDescription(nest.description || '');
    };

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            await updateNest(nestId, { name, description: description || undefined });
            await mutate();
            setEditing(false);
            toast.success('Nest updated successfully');
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
            await deleteNest(nestId);
            toast.success('Nest deleted successfully');
            navigate('/admin/nests');
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteEgg = async (egg: AdminEgg) => {
        if (!confirm(`Delete egg "${egg.name}"? This action cannot be undone.`)) return;
        try {
            await deleteEgg(nestId, egg.id);
            toast.success(`Egg "${egg.name}" deleted`);
            mutate();
        } catch (e: any) {
            toast.error(httpErrorToHuman(e));
        }
    };

    if (fetchError) return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(fetchError)}</div>;
    if (!nest) return <Spinner />;

    const eggs = eggsData?.items || [];

    const createdAge = (() => {
        const created = new Date(nest.createdAt);
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
                    <Link to='/admin/nests' className='text-sm text-mocha-200 hover:text-cream-400 transition-colors'>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                        </svg>
                    </Link>
                    <h1 className='text-2xl font-bold text-cream-400'>{nest.name}</h1>
                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-mocha-400/50 text-mocha-200 border border-mocha-400/50'>
                        {nest.author}
                    </span>
                </div>
                <div className='flex items-center gap-3'>
                    {activeTab === 'details' && editing && (
                        <Button variant='default' onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                    <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                        Delete Nest
                    </Button>
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className='flex items-center gap-2 p-1 bg-mocha-500/50 border border-mocha-400/50 rounded-xl w-fit mt-4'>
                {([
                    { key: 'details', label: 'Details', icon: InformationCircleIcon },
                    { key: 'eggs', label: 'Eggs', icon: EggsIcon },
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
                {/* ── Details Tab ── */}
                {activeTab === 'details' && (
                    <div className='space-y-6'>
                        {/* Profile Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                                <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                                    <HugeiconsIcon icon={CubeIcon} className='w-8 h-8 text-cream-400' />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-cream-400 font-medium text-lg'>{nest.name}</p>
                                    {nest.description && (
                                        <p className='text-mocha-200 text-sm mt-0.5'>{nest.description}</p>
                                    )}
                                </div>
                                <div className='flex items-center gap-3'>
                                    <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                        <p className='text-2xl font-bold text-cream-400'>{eggs.length}</p>
                                        <p className='text-xs text-mocha-200'>Eggs</p>
                                    </div>
                                    <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                                        <p className='text-2xl font-bold text-cream-400'>{nest.serversCount}</p>
                                        <p className='text-xs text-mocha-200'>Servers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Info Card */}
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                        <svg className='w-5 h-5 text-cream-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className='text-cream-400 font-semibold text-lg'>Nest Details</h3>
                                        <p className='text-mocha-200 text-sm'>Identification and metadata</p>
                                    </div>
                                </div>
                                {!editing && (
                                    <Button variant='secondary' onClick={() => setEditing(true)}>
                                        Edit Details
                                    </Button>
                                )}
                            </div>

                            {editing ? (
                                <div className='space-y-5'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                                        <div>
                                            <label className={labelClass}>Nest Name *</label>
                                            <input
                                                type='text'
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Description</label>
                                            <input
                                                type='text'
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className={inputClass}
                                                placeholder='Optional description'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex items-center gap-3 pt-2'>
                                        <Button variant='default' onClick={handleSave} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            variant='secondary'
                                            onClick={() => {
                                                syncFromNest();
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
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Nest ID</span>
                                            <p className='text-cream-400 font-medium mt-1'>{nest.id}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>UUID</span>
                                            <p className='text-cream-400 font-mono text-sm mt-1 truncate' title={nest.uuid}>
                                                {nest.uuid}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Author</span>
                                            <p className='text-cream-400 text-sm mt-1'>{nest.author}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Name</span>
                                            <p className='text-cream-400 font-medium mt-1'>{nest.name}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Description</span>
                                            <p className='text-cream-400 text-sm mt-1'>{nest.description || <span className='text-mocha-200/60'>None</span>}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Eggs</span>
                                            <p className='text-cream-400 font-medium mt-1'>{eggs.length}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Servers</span>
                                            <p className='text-cream-400 font-medium mt-1'>{nest.serversCount}</p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Created</span>
                                            <p className='text-cream-400 text-sm mt-1' title={nest.createdAt}>
                                                {createdAge}
                                            </p>
                                        </div>
                                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                                            <span className='text-mocha-200 text-xs uppercase tracking-wider'>Last Updated</span>
                                            <p className='text-cream-400 text-sm mt-1' title={nest.updatedAt}>
                                                {nest.updatedAt ? new Date(nest.updatedAt).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Eggs Tab ── */}
                {activeTab === 'eggs' && (
                    <div className='space-y-4'>
                        <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                                    <HugeiconsIcon icon={EggsIcon} className='w-5 h-5 text-cream-400' />
                                </div>
                                <div>
                                    <h3 className='text-cream-400 font-semibold text-lg'>Nest Eggs</h3>
                                    <p className='text-mocha-200 text-sm'>
                                        {eggs.length} egg{eggs.length !== 1 ? 's' : ''} in this nest
                                    </p>
                                </div>
                            </div>

                            {eggsError && <div className='text-red-400 mb-4 text-sm'>Error loading eggs: {httpErrorToHuman(eggsError)}</div>}

                            {eggs.length > 0 ? (
                                <div className='bg-mocha-500 border border-mocha-400 rounded-lg overflow-hidden'>
                                    <table className='w-full text-sm'>
                                        <thead>
                                            <tr className='border-b border-mocha-400'>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Name</th>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium'>Author</th>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium hidden md:table-cell'>Docker Image</th>
                                                <th className='text-left px-4 py-3 text-mocha-200 font-medium hidden lg:table-cell'>Features</th>
                                                <th className='text-right px-4 py-3 text-mocha-200 font-medium'>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {eggs.map((egg) => (
                                                <tr
                                                    key={egg.id}
                                                    className='border-b border-mocha-400 last:border-0 hover:bg-mocha-400/20'
                                                >
                                                    <td className='px-4 py-3'>
                                                        <Link
                                                            to={`eggs/${egg.id}`}
                                                            className='text-cream-400 font-medium hover:text-cream-200'
                                                        >
                                                            {egg.name}
                                                        </Link>
                                                    </td>
                                                    <td className='px-4 py-3 text-mocha-100'>{egg.author}</td>
                                                    <td className='px-4 py-3 text-mocha-100 hidden md:table-cell'>
                                                        <code className='text-xs text-cream-400 bg-mocha-600/50 px-1.5 py-0.5 rounded'>
                                                            {Object.values(egg.dockerImages || {})[0] || '—'}
                                                        </code>
                                                    </td>
                                                    <td className='px-4 py-3 hidden lg:table-cell'>
                                                        {egg.features && egg.features.length > 0 ? (
                                                            <div className='flex flex-wrap gap-1'>
                                                                {egg.features.map((f) => (
                                                                    <span key={f} className='inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-mocha-400/50 text-mocha-200'>
                                                                        {f}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className='text-mocha-200/60 text-xs'>—</span>
                                                        )}
                                                    </td>
                                                    <td className='px-4 py-3 text-right'>
                                                        <div className='flex items-center justify-end gap-2'>
                                                            <Link
                                                                to={`eggs/${egg.id}`}
                                                                className='text-xs text-cream-400 hover:text-cream-500'
                                                            >
                                                                View
                                                            </Link>
                                                            <Button
                                                                variant='attention'
                                                                size='sm'
                                                                onClick={() => handleDeleteEgg(egg)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className='text-center py-12 text-mocha-200'>
                                    <HugeiconsIcon icon={EggsIcon} className='w-12 h-12 mx-auto mb-3 text-mocha-400' />
                                    <p className='text-sm'>No eggs in this nest yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
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
                                Permanently delete this nest and all associated eggs. This action cannot be undone.
                            </p>
                            <Button variant='attention' onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Delete Nest'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog.Confirm
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirmed={handleDelete}
                title='Delete Nest'
                confirm='Delete'
            >
                Are you sure you want to permanently delete nest <strong>{nest.name}</strong>? All eggs in this nest will also be deleted. This action cannot be undone.
            </Dialog.Confirm>
        </div>
    );
};

const AdminNestViewContainer = () => {
    return (
        <Routes>
            <Route index element={<AdminNestView />} />
            <Route path='eggs/:eggId/*' element={<AdminEggViewContainer />} />
        </Routes>
    );
};

export default AdminNestViewContainer;
