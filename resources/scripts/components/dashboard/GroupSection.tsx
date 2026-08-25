import {
    ArrowDownToLine,
    EllipsisVertical,
    FolderOpen,
    FolderOpenFill,
    Pencil,
    Plus,
    TrashBin,
} from '@gravity-ui/icons';
import { useCallback, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import type { Server } from '@/api/server/getServer';
import getServerGroups, {
    addServersToGroup,
    deleteServerGroup,
    removeServersFromGroup,
    updateServerGroup,
} from '@/api/serverGroups';
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
    const { mutate } = useSWRConfig();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [renamingGroup, setRenamingGroup] = useState<{ id: number; name: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deletingGroup, setDeletingGroup] = useState<{ id: number; name: string } | null>(null);
    const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);
    const [dragOverUngrouped, setDragOverUngrouped] = useState(false);

    const revalidateServers = useCallback(() => {
        mutate((key: unknown) => Array.isArray(key) && key[0] === '/api/client/servers');
    }, [mutate]);

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
            revalidateServers();
        },
        [servers, mutateGroups, revalidateServers],
    );

    const handleDropToUngrouped = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setDragOverUngrouped(false);
            const serverId = e.dataTransfer.getData('text/plain');
            if (!serverId) return;

            const server = servers.find((s) => s.id === serverId);
            if (!server || !server.group) return;

            await removeServersFromGroup(server.group.id, [server.internalId as number]);
            mutateGroups();
            revalidateServers();
        },
        [servers, mutateGroups, revalidateServers],
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
        revalidateServers();
        setDeletingGroup(null);
    }, [deletingGroup, mutateGroups, revalidateServers]);

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
                <div className='flex flex-col items-center justify-center py-16 text-center'>
                    <div className='size-16 rounded-2xl bg-mocha-500/50 flex items-center justify-center mb-4'>
                        <FolderOpen className='size-8 text-zinc-500' />
                    </div>
                    <p className='text-sm font-medium text-zinc-300 mb-1'>No groups yet</p>
                    <p className='text-xs text-zinc-500 mb-5 max-w-xs'>
                        Create groups to organize your servers by purpose, game type, or anything else.
                    </p>
                    <button
                        type='button'
                        onClick={() => setShowCreateModal(true)}
                        className='flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors'
                    >
                        <Plus className='size-4' />
                        Create Group
                    </button>
                </div>
                {ungroupedServers.length > 0 && (
                    <div className='rounded-xl border border-[#ffffff08] bg-mocha-500/30 overflow-hidden'>
                        <div className='px-4 py-3 border-b border-[#ffffff08]'>
                            <span className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>
                                Ungrouped
                            </span>
                            <span className='text-xs text-zinc-600 ml-2'>{ungroupedServers.length}</span>
                        </div>
                        <div className='p-3 space-y-1.5'>
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
            </>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <h3 className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>Groups</h3>
                    <span className='text-xs text-zinc-600'>{groups.length}</span>
                </div>
                <button
                    type='button'
                    onClick={() => setShowCreateModal(true)}
                    className='flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-xs font-medium transition-colors'
                >
                    <Plus className='size-3.5' />
                    New Group
                </button>
            </div>

            {groups.map((group) => {
                const groupServers = serversByGroup[group.id] || [];
                const isDragOver = dragOverGroupId === group.id;

                return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: Drag-and-drop group container
                    <div
                        key={group.id}
                        className={`rounded-xl border transition-all duration-150 ${
                            isDragOver
                                ? 'border-accent/40 bg-accent/[0.07] shadow-[0_0_20px_-8px] shadow-accent/20'
                                : 'border-[#ffffff08] bg-mocha-500/30 hover:bg-mocha-500/40'
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
                                <div
                                    className={`transition-transform duration-200 ${group.is_collapsed ? '' : 'rotate-90'}`}
                                >
                                    <FolderOpen className='size-4 text-zinc-500 shrink-0' />
                                </div>
                                <span className='text-sm font-medium text-zinc-200 truncate'>{group.name}</span>
                                <span className='text-xs text-zinc-600 tabular-nums'>{groupServers.length}</span>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type='button'
                                        className='p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-[#ffffff08] transition-colors rounded-md'
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

                        {!group.is_collapsed && groupServers.length > 0 && (
                            <div className='px-3 pb-3 space-y-1'>
                                {groupServers.map((server, index) => (
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

                        {!group.is_collapsed && groupServers.length === 0 && (
                            <div className='px-4 pb-4'>
                                <p className='text-xs text-zinc-600 text-center py-2'>
                                    Drag servers here to add them to this group
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* biome-ignore lint/a11y/noStaticElementInteractions: Ungrouped drop zone */}
            <div
                className={`rounded-xl border border-dashed transition-all duration-150 overflow-hidden ${
                    dragOverUngrouped
                        ? 'border-accent/40 bg-accent/[0.07] shadow-[0_0_20px_-8px] shadow-accent/20'
                        : ungroupedServers.length > 0
                          ? 'border-[#ffffff08] bg-mocha-500/20'
                          : 'border-[#ffffff06] bg-transparent'
                }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverUngrouped(true);
                }}
                onDragLeave={() => setDragOverUngrouped(false)}
                onDrop={handleDropToUngrouped}
            >
                {ungroupedServers.length > 0 ? (
                    <>
                        <div className='px-4 py-3 border-b border-[#ffffff08] flex items-center gap-2'>
                            <span className='text-xs font-medium text-zinc-500 uppercase tracking-wider'>
                                Ungrouped
                            </span>
                            <span className='text-xs text-zinc-600 tabular-nums'>{ungroupedServers.length}</span>
                        </div>
                        <div className='p-3 space-y-1'>
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
                    </>
                ) : (
                    <div className='px-4 py-6 flex flex-col items-center justify-center text-center'>
                        {dragOverUngrouped ? <ArrowDownToLine className='size-5 text-accent mb-2' /> : null}
                        <p className='text-xs text-zinc-600'>
                            {dragOverUngrouped ? 'Drop to ungroup' : 'Drag servers here to ungroup them'}
                        </p>
                    </div>
                )}
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
