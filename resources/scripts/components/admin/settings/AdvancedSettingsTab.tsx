import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings02Icon, Edit02Icon, Link02Icon, ServerStack02Icon } from '@hugeicons/core-free-icons';

import Spinner from '@/components/elements/Spinner';
import { getAdvancedSettings, updateAdvancedSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const AdvancedSettingsTab = () => {
    const { data: settings, isLoading, error: fetchError, mutate } = useSWR('admin:settings:advanced', getAdvancedSettings);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        'pterodactyl:guzzle:connect_timeout': 5,
        'pterodactyl:guzzle:timeout': 30,
        'pterodactyl:client_features:allocations:enabled': 'false',
        'pterodactyl:client_features:allocations:range_start': null as number | null,
        'pterodactyl:client_features:allocations:range_end': null as number | null,
    });
    const [formInit, setFormInit] = useState(false);

    if (settings && !formInit) {
        setFormInit(true);
        setForm(settings);
    }

    const handleSave = () => {
        setSaving(true);
        updateAdvancedSettings(form)
            .then(() => {
                toast.success('Advanced settings updated successfully');
                mutate();
                setEditing(false);
            })
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleCancel = () => {
        if (settings) {
            setForm(settings);
        }
        setEditing(false);
    };

    const allocationsEnabled = form['pterodactyl:client_features:allocations:enabled'] === 'true';

    if (isLoading || !settings) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    if (fetchError) {
        return <div className='text-red-400 p-4'>Error: {httpErrorToHuman(fetchError)}</div>;
    }

    return (
        <div className='space-y-6 mt-4'>
            {/* Profile Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                    <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        <HugeiconsIcon icon={Settings02Icon} className='w-8 h-8 text-brand' />
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-xl font-bold text-cream-400'>Advanced Settings</h2>
                        <p className='text-mocha-200 text-sm mt-1'>HTTP connection timeouts and allocation features</p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{settings['pterodactyl:guzzle:connect_timeout']}s</p>
                            <p className='text-xs text-mocha-200'>Connect Timeout</p>
                        </div>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{settings['pterodactyl:guzzle:timeout']}s</p>
                            <p className='text-xs text-mocha-200'>Request Timeout</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* HTTP Connections Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <HugeiconsIcon icon={Link02Icon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>HTTP Connections</h3>
                            <p className='text-mocha-200 text-sm'>Timeout configuration for outgoing requests</p>
                        </div>
                    </div>
                    {!editing && (
                        <Button variant='secondary' onClick={() => setEditing(true)}>
                            <HugeiconsIcon icon={Edit02Icon} className='w-4 h-4' />
                            Edit Settings
                        </Button>
                    )}
                </div>

                {editing ? (
                    <div className='space-y-5'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                            <div>
                                <label className={labelClass}>Connection Timeout</label>
                                <input
                                    type='number'
                                    className={inputClass}
                                    value={form['pterodactyl:guzzle:connect_timeout']}
                                    onChange={(e) => setForm({ ...form, 'pterodactyl:guzzle:connect_timeout': parseInt(e.target.value) || 0 })}
                                    min={1}
                                    max={60}
                                    required
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>Seconds to wait before timing out a connection attempt.</p>
                            </div>
                            <div>
                                <label className={labelClass}>Request Timeout</label>
                                <input
                                    type='number'
                                    className={inputClass}
                                    value={form['pterodactyl:guzzle:timeout']}
                                    onChange={(e) => setForm({ ...form, 'pterodactyl:guzzle:timeout': parseInt(e.target.value) || 0 })}
                                    min={1}
                                    max={60}
                                    required
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>Seconds to wait before timing out an active request.</p>
                            </div>
                        </div>

                        <div className='flex items-center gap-3 pt-2'>
                            <Button variant='default' onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant='secondary' onClick={handleCancel}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Connection Timeout</p>
                            <p className='text-cream-400 font-medium mt-1'>{settings['pterodactyl:guzzle:connect_timeout']}s</p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Request Timeout</p>
                            <p className='text-cream-400 font-medium mt-1'>{settings['pterodactyl:guzzle:timeout']}s</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Automatic Allocation Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <HugeiconsIcon icon={ServerStack02Icon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>Automatic Allocation Creation</h3>
                            <p className='text-mocha-200 text-sm'>Let users create allocations from the frontend</p>
                        </div>
                    </div>
                </div>

                {editing ? (
                    <div className='space-y-5'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                            <div>
                                <label className={labelClass}>Status</label>
                                <select
                                    className={inputClass}
                                    value={form['pterodactyl:client_features:allocations:enabled']}
                                    onChange={(e) => setForm({ ...form, 'pterodactyl:client_features:allocations:enabled': e.target.value })}
                                >
                                    <option value='false'>Disabled</option>
                                    <option value='true'>Enabled</option>
                                </select>
                                <p className='text-xs text-mocha-200/60 mt-1'>Let users automatically create allocations from the frontend.</p>
                            </div>
                            <div>
                                <label className={labelClass}>Starting Port</label>
                                <input
                                    type='number'
                                    className={inputClass}
                                    value={form['pterodactyl:client_features:allocations:range_start'] ?? ''}
                                    onChange={(e) => setForm({ ...form, 'pterodactyl:client_features:allocations:range_start': e.target.value ? parseInt(e.target.value) : null })}
                                    disabled={!allocationsEnabled}
                                    min={1024}
                                    max={65535}
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>First port in the allocatable range.</p>
                            </div>
                            <div>
                                <label className={labelClass}>Ending Port</label>
                                <input
                                    type='number'
                                    className={inputClass}
                                    value={form['pterodactyl:client_features:allocations:range_end'] ?? ''}
                                    onChange={(e) => setForm({ ...form, 'pterodactyl:client_features:allocations:range_end': e.target.value ? parseInt(e.target.value) : null })}
                                    disabled={!allocationsEnabled}
                                    min={1024}
                                    max={65535}
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>Last port in the allocatable range.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Status</p>
                            <div className='flex items-center gap-2 mt-1'>
                                <p className={`font-medium ${settings['pterodactyl:client_features:allocations:enabled'] === 'true' ? 'text-green-400' : 'text-mocha-200'}`}>
                                    {settings['pterodactyl:client_features:allocations:enabled'] === 'true' ? 'Enabled' : 'Disabled'}
                                </p>
                            </div>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Starting Port</p>
                            <p className='text-cream-400 font-medium mt-1 font-mono text-sm'>
                                {settings['pterodactyl:client_features:allocations:range_start'] ?? '—'}
                            </p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Ending Port</p>
                            <p className='text-cream-400 font-medium mt-1 font-mono text-sm'>
                                {settings['pterodactyl:client_features:allocations:range_end'] ?? '—'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedSettingsTab;
