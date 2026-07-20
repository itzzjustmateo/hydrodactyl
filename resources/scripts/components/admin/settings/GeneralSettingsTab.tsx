import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { InformationCircleIcon, LanguageSquareIcon, Shield01Icon, Edit02Icon } from '@hugeicons/core-free-icons';

import Spinner from '@/components/elements/Spinner';
import { getGeneralSettings, updateGeneralSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';

const inputClass =
    'w-full bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors';
const labelClass = 'block text-sm text-mocha-200 mb-1';

const GeneralSettingsTab = () => {
    const { data: settings, isLoading, error: fetchError, mutate } = useSWR('admin:settings:general', getGeneralSettings);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ 'app:name': '', 'app:locale': '', 'pterodactyl:auth:2fa_required': 0 });
    const [formInit, setFormInit] = useState(false);

    if (settings && !formInit) {
        setFormInit(true);
        setForm({
            'app:name': settings['app:name'],
            'app:locale': settings['app:locale'],
            'pterodactyl:auth:2fa_required': settings['pterodactyl:auth:2fa_required'],
        });
    }

    const handleSave = () => {
        setSaving(true);
        updateGeneralSettings(form)
            .then(() => {
                toast.success('General settings updated successfully');
                mutate();
                setEditing(false);
            })
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    const handleCancel = () => {
        if (settings) {
            setForm({
                'app:name': settings['app:name'],
                'app:locale': settings['app:locale'],
                'pterodactyl:auth:2fa_required': settings['pterodactyl:auth:2fa_required'],
            });
        }
        setEditing(false);
    };

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

    const languages = settings.available_languages || {};
    const levels: [number, string, string][] = [
        [0, 'Not Required', '2FA is optional for all users'],
        [1, 'Admin Only', 'Only administrators must have 2FA enabled'],
        [2, 'All Users', 'Every account must have 2FA enabled'],
    ];

    const twoFaLabel = levels.find(([val]) => val === settings['pterodactyl:auth:2fa_required'])?.[1] || 'Unknown';

    return (
        <div className='space-y-6 mt-4'>
            {/* Profile Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                    <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        <HugeiconsIcon icon={InformationCircleIcon} className='w-8 h-8 text-brand' />
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-xl font-bold text-cream-400'>{settings['app:name'] || 'Panel'}</h2>
                        <p className='text-mocha-200 text-sm mt-1'>General panel configuration and authentication settings</p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{settings['app:locale'] || 'en'}</p>
                            <p className='text-xs text-mocha-200'>Locale</p>
                        </div>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>2FA</p>
                            <p className='text-xs text-mocha-200'>{twoFaLabel}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <HugeiconsIcon icon={InformationCircleIcon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>General Settings</h3>
                            <p className='text-mocha-200 text-sm'>Company name, locale, and authentication</p>
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
                                <label className={labelClass}>Company Name</label>
                                <input
                                    type='text'
                                    className={inputClass}
                                    value={form['app:name']}
                                    onChange={(e) => setForm({ ...form, 'app:name': e.target.value })}
                                />
                                <p className='text-xs text-mocha-200/60 mt-1'>Displayed throughout the panel and in outgoing emails.</p>
                            </div>
                            <div>
                                <label className={labelClass}>Default Language</label>
                                <select
                                    className={inputClass}
                                    value={form['app:locale']}
                                    onChange={(e) => setForm({ ...form, 'app:locale': e.target.value })}
                                >
                                    {Object.keys(languages).length === 0 && (
                                        <option value='' disabled className='bg-mocha-600 text-mocha-200'>No languages available</option>
                                    )}
                                    {Object.entries(languages).map(([key, value]) => (
                                        <option key={key} value={key} className='bg-mocha-600 text-cream-400'>{value}</option>
                                    ))}
                                </select>
                                <p className='text-xs text-mocha-200/60 mt-1'>Default language for UI components.</p>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Require 2-Factor Authentication</label>
                            <div className='flex gap-2'>
                                {levels.map(([val, label, desc]) => (
                                    <label key={val} className='flex-1 cursor-pointer'>
                                        <input
                                            type='radio'
                                            name='2fa_required'
                                            value={val}
                                            checked={form['pterodactyl:auth:2fa_required'] === val}
                                            onChange={() => setForm({ ...form, 'pterodactyl:auth:2fa_required': val })}
                                            className='hidden peer'
                                        />
                                        <div className='px-4 py-3 bg-mocha-600 border border-mocha-400 rounded-lg text-center peer-checked:border-mocha-300 peer-checked:bg-mocha-500/20 transition-colors'>
                                            <div className={`text-sm font-medium ${form['pterodactyl:auth:2fa_required'] === val ? 'text-cream-400' : 'text-mocha-100'}`}>{label}</div>
                                            <div className='text-xs text-mocha-200/60 mt-1'>{desc}</div>
                                        </div>
                                    </label>
                                ))}
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
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Company Name</p>
                            <p className='text-cream-400 font-medium mt-1'>{settings['app:name'] || '—'}</p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>Default Locale</p>
                            <p className='text-cream-400 font-medium mt-1'>{settings['app:locale'] || '—'}</p>
                        </div>
                        <div className='bg-mocha-600/50 rounded-lg p-4'>
                            <p className='text-mocha-200 text-xs uppercase tracking-wider'>2FA Requirement</p>
                            <p className='text-cream-400 font-medium mt-1'>{twoFaLabel}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralSettingsTab;
