import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBrush02Icon, Upload02Icon, Clock01Icon } from '@hugeicons/core-free-icons';

import Spinner from '@/components/elements/Spinner';
import { getBrandingSettings, type BrandingSettings, updateBrandingSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/elements/dialog';

const BrandingSettingsTab = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<BrandingSettings | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [urlPreview, setUrlPreview] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [rewindTarget, setRewindTarget] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getBrandingSettings()
            .then(setSettings)
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    }, []);

    const handleFileSelect = (file: File) => {
        if (!file.type.match('image.*')) return;
        setSelectedFile(file);
        setLogoUrl('');
        setUrlPreview(null);

        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleUrlPreview = () => {
        if (!logoUrl.trim()) return;
        setUrlPreview(logoUrl.trim());
        setSelectedFile(null);
        setFilePreview(null);
    };

    const handleSave = (remove?: boolean, rewindIndex?: number) => {
        setSaving(true);

        const formData = new FormData();
        if (remove) {
            formData.append('remove', '1');
        } else if (rewindIndex !== undefined) {
            formData.append('rewind', String(rewindIndex));
        } else if (selectedFile) {
            formData.append('logo_file', selectedFile);
        } else if (logoUrl.trim()) {
            formData.append('logo_url', logoUrl.trim());
        } else {
            toast.error('Please select a logo file or enter a URL.');
            setSaving(false);
            return;
        }

        updateBrandingSettings(formData)
            .then(() => {
                toast.success('Logo settings updated successfully');
                setFilePreview(null);
                setUrlPreview(null);
                setSelectedFile(null);
                setLogoUrl('');
                setRewindTarget(null);
                return getBrandingSettings();
            })
            .then(setSettings)
            .catch((e) => toast.error(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    const history = settings?.history || [];
    const currentLogoUrl = settings?.logoUrl;

    return (
        <div className='space-y-6 mt-4'>
            {/* Profile Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5'>
                    <div className='w-16 h-16 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 border border-mocha-400'>
                        {currentLogoUrl ? (
                            <img src={currentLogoUrl} alt='Current Logo' className='w-12 h-12 rounded-lg object-contain' />
                        ) : (
                            <HugeiconsIcon icon={PaintBrush02Icon} className='w-8 h-8 text-brand' />
                        )}
                    </div>
                    <div className='flex-1'>
                        <h2 className='text-xl font-bold text-cream-400'>Branding</h2>
                        <p className='text-mocha-200 text-sm mt-1'>Customize your panel's logo and appearance</p>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{settings?.logoType || 'None'}</p>
                            <p className='text-xs text-mocha-200'>Logo Type</p>
                        </div>
                        <div className='text-center bg-mocha-600/50 rounded-lg px-4 py-3'>
                            <p className='text-2xl font-bold text-cream-400'>{history.length}</p>
                            <p className='text-xs text-mocha-200'>History</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Experimental Warning */}
            <div className='bg-amber-900/20 border border-amber-800 rounded-xl p-4 text-amber-400 text-sm flex items-start gap-3'>
                <HugeiconsIcon icon={PaintBrush02Icon} className='w-5 h-5 shrink-0 mt-0.5' />
                <span><strong>Experimental:</strong> Logo customization is a new, experimental feature. Some aspects may change in future updates.</span>
            </div>

            {/* Current Logo Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <HugeiconsIcon icon={PaintBrush02Icon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>Current Logo</h3>
                            <p className='text-mocha-200 text-sm'>Currently active panel branding</p>
                        </div>
                    </div>
                    {currentLogoUrl && (
                        <Button variant='attention' onClick={() => handleSave(true)} disabled={saving}>
                            {saving ? 'Removing...' : 'Remove Logo'}
                        </Button>
                    )}
                </div>
                <div className='flex items-center justify-center min-h-30'>
                    {currentLogoUrl ? (
                        <img src={currentLogoUrl} alt='Current Logo' className='max-w-full max-h-50 rounded border border-mocha-400' />
                    ) : (
                        <div className='text-center py-8'>
                            <HugeiconsIcon icon={PaintBrush02Icon} className='w-12 h-12 mx-auto mb-3 text-mocha-400' />
                            <p className='text-mocha-200 text-sm'>No custom logo configured</p>
                            <p className='text-mocha-200/60 text-xs mt-1'>Using default panel branding</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload New Logo Card */}
            <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                <div className='flex items-center gap-3 mb-6'>
                    <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                        <HugeiconsIcon icon={Upload02Icon} className='w-5 h-5 text-cream-400' />
                    </div>
                    <div>
                        <h3 className='text-cream-400 font-semibold text-lg'>Upload New Logo</h3>
                        <p className='text-mocha-200 text-sm'>Upload a file or provide a URL</p>
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <label className='block text-sm text-mocha-200 mb-2'>Upload Logo</label>
                        <div
                            className='border-2 border-dashed border-mocha-400 rounded-lg p-10 text-center cursor-pointer transition-all hover:border-mocha-300 hover:bg-mocha-400/10'
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
                            onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                        >
                            <HugeiconsIcon icon={Upload02Icon} className='w-12 h-12 text-mocha-200/60 mx-auto mb-2' />
                            <p className='text-mocha-200 text-sm'><strong className='text-mocha-200'>Click to choose</strong> or drag and drop</p>
                            <p className='text-mocha-200/60 text-xs mt-1'>PNG, JPG, GIF, WEBP or SVG (max 2MB)</p>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
                                className='hidden'
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />
                        </div>
                        {filePreview && (
                            <div className='mt-3 text-center'>
                                <img src={filePreview} alt='Preview' className='max-w-full max-h-37.5 rounded mx-auto border border-mocha-400 p-1' />
                                <p className='text-mocha-200 text-xs mt-1'>Preview</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className='block text-sm text-mocha-200 mb-2'>Or use a URL</label>
                        <div className='flex gap-1'>
                            <input
                                type='url'
                                className='flex-1 bg-mocha-600 border border-mocha-400 rounded px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-mocha-300 transition-colors'
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder='https://example.com/logo.png'
                            />
                            <Button type='button' variant='secondary' onClick={handleUrlPreview}>
                                Preview
                            </Button>
                        </div>
                        <p className='text-xs text-mocha-200/60 mt-1'>Enter a direct link to an image hosted elsewhere.</p>
                        {urlPreview && (
                            <div className='mt-3 text-center'>
                                <img src={urlPreview} alt='URL Preview' className='max-w-full max-h-37.5 rounded mx-auto border border-mocha-400 p-1' />
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex items-center justify-end gap-3 pt-4'>
                    <Button
                        variant='default'
                        onClick={() => handleSave()}
                        disabled={saving || (!selectedFile && !logoUrl.trim())}
                    >
                        {saving ? 'Saving...' : 'Save Logo'}
                    </Button>
                </div>
            </div>

            {/* Logo History Card */}
            {history.length > 0 && (
                <div className='bg-mocha-500 border border-mocha-400 rounded-xl p-6'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 bg-mocha-400 rounded-lg flex items-center justify-center'>
                            <HugeiconsIcon icon={Clock01Icon} className='w-5 h-5 text-cream-400' />
                        </div>
                        <div>
                            <h3 className='text-cream-400 font-semibold text-lg'>Logo History</h3>
                            <p className='text-mocha-200 text-sm'>Last 10 logos — click to revert</p>
                        </div>
                    </div>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                        {history.map((entry, index) => {
                            const isCurrent = settings?.logoType && settings?.logoValue && entry.type === settings.logoType && entry.value === settings.logoValue;
                            const imgSrc = entry.type === 'upload' ? `/storage/${entry.value}` : entry.value;
                            return (
                                <div
                                    key={index}
                                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all text-center ${isCurrent ? 'border-mocha-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-mocha-400 hover:border-mocha-300'}`}
                                    onClick={() => { if (!isCurrent) setRewindTarget(index); }}
                                >
                                    <img src={imgSrc} alt={`Logo ${index + 1}`} className='max-w-full max-h-20 mx-auto rounded' onError={(e) => { (e.target as HTMLElement).closest('[class*="border"]')?.classList.add('hidden'); }} />
                                    <p className={`text-xs mt-1 font-medium ${isCurrent ? 'text-cream-400' : 'text-mocha-200'}`}>
                                        {isCurrent ? 'Current' : `#${index + 1}`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Rewind Confirmation Dialog */}
            <Dialog.Confirm
                open={rewindTarget !== null}
                onClose={() => setRewindTarget(null)}
                onConfirmed={() => { if (rewindTarget !== null) handleSave(false, rewindTarget); }}
                title='Revert Logo'
                confirm='Revert'
                loading={saving}
            >
                Are you sure you want to revert to logo version <strong>#{rewindTarget !== null ? rewindTarget + 1 : ''}</strong>?
            </Dialog.Confirm>
        </div>
    );
};

export default BrandingSettingsTab;
