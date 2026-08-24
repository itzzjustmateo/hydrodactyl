import { useCallback, useState } from 'react';
import { createServerGroup } from '@/api/serverGroups';
import { Dialog } from '@/components/elements/dialog';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';

interface CreateGroupModalProps {
    onClose: () => void;
    onCreated: () => void;
}

const CreateGroupModal = ({ onClose, onCreated }: CreateGroupModalProps) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!name.trim()) return;

        setLoading(true);
        setError(null);

        try {
            await createServerGroup(name.trim());
            onCreated();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create group';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [name, onCreated]);

    return (
        <Dialog.Confirm
            open
            onClose={onClose}
            title='Create Server Group'
            confirm='Create Group'
            onConfirmed={handleSubmit}
            confirmDisabled={!name.trim() || loading}
        >
            <div className='space-y-4'>
                <div>
                    <Label className='text-sm text-[#ffffff77]'>Group Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='e.g. Minecraft Servers'
                        autoFocus
                        className='w-full'
                    />
                </div>
                {error && <p className='text-sm text-red-400'>{error}</p>}
            </div>
        </Dialog.Confirm>
    );
};

export default CreateGroupModal;
