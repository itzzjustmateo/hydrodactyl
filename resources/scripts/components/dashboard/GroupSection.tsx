import { EllipsisVertical, FolderOpen, FolderOpenFill, Pencil, Plus, TrashBin } from '@gravity-ui/icons';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { Server } from '@/api/server/getServer';
import getServerGroups, { addServersToGroup, deleteServerGroup, updateServerGroup } from '@/api/serverGroups';
import CreateGroupModal from '@/components/dashboard/CreateGroupModal';
import ServerRow from '@/components/dashboard/ServerRow';
import { Dialog } from '@/components/elements/dialog';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GroupSectionProps {
    servers: Server[];
    displayOption: 'list' | 'grid';
}

const GroupSection = ({ servers, displayOption }: GroupSectionProps) => {
    const { data: groups, mutate: mutateGroups } = useSWR('server-groups', () => getServerGroups());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [renamingGroup, setRenamingGroup] = useState<{ id: number; name: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deletingGroup, setDeletingGroup] = useState<{ id: number; name: string } | null>(null);
    const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);

    const ungroupedServers = useMemo(() => {
        return servers.filter((s) => !s.group);
    }, [servers]);

    const serversByGroup = useMemo(() => {
        if (!groups) return {};
        const map: Record<number, Server[]> = {};
        for (const group of groups) {
            map[group.id] = servers.filter((s) => s.group?.id === group.id);
        }
        return map;
    }, [servers, groups]);

    const handleDragStart = useCallback((e: React.DragEvent, serverId: string) => {
        e.dataTransfer.setData('text/plain', serverId);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, groupId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverGroupId(groupId);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverGroupId(null);
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent, groupId: number) => {
            e.preventDefault();
            setDragOverGroupId(null);
            const serverId = e.dataTransfer.getData('text/plain');
            if (!serverId) return;

            const server = servers.find((s) => s.id === serverId);
            if (!server) return;

            await addServersToGroup(groupId, [server.internalId as number]);
            mutateGroups();
        },
        [servers, mutateGroups],
    );

    const handleRename = useCallback(async () => {
        if (!renamingGroup || !renameValue.trim()) return;
        await updateServerGroup(renamingGroup.id, { name: renameValue.trim() });
        mutateGroups();
        setRenamingGroup(null);
        setRenameValue('');
    }, [renamingGroup, renameValue, mutateGroups]);

    const handleDelete = useCallback(async () => {
        if (!deletingGroup) return;
        await deleteServerGroup(deletingGroup.id);
        mutateGroups();
        setDeletingGroup(null);
    }, [deletingGroup, mutateGroups]);

    const handleToggleCollapse = useCallback(
        async (groupId: number, current: boolean) => {
            await updateServerGroup(groupId, { is_collapsed: !current });
            mutateGroups();
        },
        [mutateGroups],
    );

    if (!groups || groups.length === 0) {
        return (
            <>
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <FolderOpen className='size-12 text-zinc-500 mb-3' />
                    <p className='text-sm text-zinc-400 mb-4'>No groups yet. Create one to organize your servers.</p>
                    <button
                        type='button'
                        onClick={() => setShowCreateModal(true)}
                        className='flex items-center gap-2 px-4 py-2 bg-mocha-400 hover:bg-mocha-300 text-white rounded-lg text-sm font-medium transition-colors'
                    >
                        <Plus className='size-4' />
                        Create Group
                    </button>
                </div>
                {showCreateModal && (
                    <CreateGroupModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => {
                            setShowCreateModal(false);
                            mutateGroups();
                        }}
                    />
                )}
            </>
        );
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h3 className='text-sm font-medium text-zinc-300'>Groups</h3>
                <button
                    type='button'
                    onClick={() => setShowCreateModal(true)}
                    className='flex items-center gap-1.5 px-3 py-1.5 bg-mocha-400 hover:bg-mocha-300 text-white rounded-lg text-xs font-medium transition-colors'
                >
                    <Plus className='size-3.5' />
                    New Group
                </button>
            </div>

            {groups.map((group) => (
                // biome-ignore lint/a11y/noStaticElementInteractions: Drag-and-drop group container
                <div
                    key={group.id}
                    className={`rounded-lg border transition-colors ${
                        dragOverGroupId === group.id
                            ? 'border-accent/50 bg-accent/5'
                            : 'border-[#ffffff11] bg-mocha-500/50'
                    }`}
                    onDragOver={(e) => handleDragOver(e, group.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, group.id)}
                >
                    <div className='flex items-center justify-between px-4 py-3 select-none'>
                        {/* biome-ignore lint/a11y/noStaticElementInteractions: Group collapse toggle */}
                        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Handled via parent container */}
                        <div
                            className='flex items-center gap-3 flex-1 min-w-0 cursor-pointer'
                            onClick={() => handleToggleCollapse(group.id, group.is_collapsed)}
                        >
                            {group.is_collapsed ? (
                                <FolderOpen className='size-5 text-zinc-400 shrink-0' />
                            ) : (
                                <FolderOpenFill className='size-5 text-zinc-400 shrink-0' />
                            )}
                            <span className='text-sm font-medium text-zinc-200 truncate'>{group.name}</span>
                            <span className='text-xs text-zinc-500'>
                                {serversByGroup[group.id]?.length ?? 0} server
                                {(serversByGroup[group.id]?.length ?? 0) !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type='button'
                                    className='p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded'
                                    title='Group options'
                                >
                                    <EllipsisVertical className='size-4' />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent sideOffset={4}>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        setRenamingGroup({ id: group.id, name: group.name });
                                        setRenameValue(group.name);
                                    }}
                                >
                                    <Pencil className='size-3.5 mr-2' />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => setDeletingGroup({ id: group.id, name: group.name })}
                                    className='text-red-400'
                                >
                                    <TrashBin className='size-3.5 mr-2' />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {!group.is_collapsed && serversByGroup[group.id] && serversByGroup[group.id].length > 0 && (
                        <div className='px-4 pb-3 space-y-2'>
                            {serversByGroup[group.id].map((server, index) => (
                                // biome-ignore lint/a11y/noStaticElementInteractions: Draggable server row
                                <div
                                    key={server.uuid}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, server.id)}
                                    className='transform-gpu'
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <ServerRow
                                        className={
                                            displayOption === 'list'
                                                ? 'flex-row'
                                                : 'items-start! flex-col w-full gap-4 [&>div~div]:w-full'
                                        }
                                        server={server}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {ungroupedServers.length > 0 && (
                <div className='rounded-lg border border-[#ffffff11] bg-mocha-500/30'>
                    <div className='px-4 py-3'>
                        <span className='text-sm font-medium text-zinc-400'>Ungrouped</span>
                        <span className='text-xs text-zinc-500 ml-2'>
                            {ungroupedServers.length} server{ungroupedServers.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className='px-4 pb-3 space-y-2'>
                        {ungroupedServers.map((server, index) => (
                            // biome-ignore lint/a11y/noStaticElementInteractions: Draggable server row
                            <div
                                key={server.uuid}
                                draggable
                                onDragStart={(e) => handleDragStart(e, server.id)}
                                className='transform-gpu'
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <ServerRow
                                    className={
                                        displayOption === 'list'
                                            ? 'flex-row'
                                            : 'items-start! flex-col w-full gap-4 [&>div~div]:w-full'
                                    }
                                    server={server}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        mutateGroups();
                    }}
                />
            )}

            {renamingGroup && (
                <Dialog.Confirm
                    open
                    onClose={() => setRenamingGroup(null)}
                    title='Rename Group'
                    confirm='Save'
                    onConfirmed={handleRename}
                    confirmDisabled={!renameValue.trim()}
                >
                    <div className='space-y-4'>
                        <div>
                            <Label className='text-sm text-[#ffffff77]'>Group Name</Label>
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder='e.g. Minecraft Servers'
                                autoFocus
                                className='w-full'
                            />
                        </div>
                    </div>
                </Dialog.Confirm>
            )}

            {deletingGroup && (
                <Dialog.Confirm
                    open
                    onClose={() => setDeletingGroup(null)}
                    title='Delete Group'
                    confirm='Delete'
                    onConfirmed={handleDelete}
                >
                    <p className='text-sm text-zinc-400'>
                        Are you sure you want to delete <strong className='text-zinc-200'>{deletingGroup.name}</strong>?
                        Servers in this group will become ungrouped.
                    </p>
                </Dialog.Confirm>
            )}
        </div>
    );
};

export default GroupSection;
