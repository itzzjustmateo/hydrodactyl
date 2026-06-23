import { ChevronLeft, Person } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ServerContentBlock from '@/components/elements/ServerContentBlock';
import UserFormComponent from '@/components/server/users/UserFormComponent';
import { Button } from '@/components/ui/button';

import { ServerContext } from '@/state/server';
import type { Subuser } from '@/state/server/subusers';

const EditUserContainer = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const subusers = ServerContext.useStoreState((state) => state.subusers.data);

    const subuser = subusers.find((s: Subuser) => s.uuid === id);

    useEffect(() => {
        if (!subuser && subusers.length > 0) {
            navigate(`/server/${serverId}/users`);
        }
    }, [subuser, subusers, navigate, serverId]);

    const handleSuccess = () => {
        navigate(`/server/${serverId}/users`);
    };

    const handleCancel = () => {
        navigate(`/server/${serverId}/users`);
    };

    if (!subuser && subusers.length === 0) {
        return (
            <ServerContentBlock title={'Edit User'} className='p-0!'>
                <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                    <div className='flex gap-2'>
                        <Button
                            variant='secondary'
                            onClick={() => navigate(`/server/${serverId}/users`)}
                            className='gap-2'
                        >
                            <ChevronLeft width={22} height={22} className='w-4 h-4' fill='currentColor' />
                            Back to Users
                        </Button>
                    </div>
                </div>
                <div className='flex items-center justify-center py-12'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                </div>
            </ServerContentBlock>
        );
    }

    if (!subuser) {
        return (
            <ServerContentBlock title={'Edit User'} className='p-0!'>
                <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                    <div className='flex gap-2'>
                        <Button
                            variant='secondary'
                            onClick={() => navigate(`/server/${serverId}/users`)}
                            className='gap-2'
                        >
                            <ChevronLeft width={22} height={22} className='w-4 h-4' fill='currentColor' />
                            Back to Users
                        </Button>
                    </div>
                </div>
                <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
                    <div className='text-center'>
                        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                            <Person width={22} height={22} className='w-8 h-8 text-zinc-400' fill='currentColor' />
                        </div>
                        <h3 className='text-lg font-medium text-zinc-200 mb-2'>User not found</h3>
                        <p className='text-sm text-zinc-400 max-w-sm'>
                            The user you&apos;re trying to edit could not be found.
                        </p>
                    </div>
                </div>
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Edit User'} className='p-0!'>
            <div className='px-2 pt-2 sm:px-14 sm:pt-14 flex flex-col sm:flex-row items-center gap-4'>
                <div className='flex gap-2'>
                    <Button
                        variant='secondary'
                        onClick={() => navigate(`/server/${serverId}/users`)}
                        className='gap-2'
                        disabled={isSubmitting}
                    >
                        <ChevronLeft width={22} height={22} className='w-4 h-4' fill='currentColor' />
                        Back to Users
                    </Button>
                </div>
            </div>

            <div className='px-2 sm:px-14 pt-6'>
                <h1 className='text-[52px] font-extrabold leading-[98%] tracking-[-0.14rem] mb-8'>
                    Edit User: {subuser.email}
                </h1>
                <UserFormComponent
                    subuser={subuser}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                    flashKey='user:edit'
                    isSubmitting={isSubmitting}
                    setIsSubmitting={setIsSubmitting}
                />
            </div>
        </ServerContentBlock>
    );
};

export default EditUserContainer;
