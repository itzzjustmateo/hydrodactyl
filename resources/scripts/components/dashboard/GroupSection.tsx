import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import { FolderOpenFill, FolderOpen, Pencil, TrashBin, Plus } from '@gravity-ui/icons';
import type { Server } from '@/api/server/getServer';
import getServerGroups, {
    type ServerGroup,
    updateServerGroup,
    deleteServerGroup,
    addServersToGroup,
} from '@/api/serverGroups';
import ServerRow from '@/components/dashboard/ServerRow';
import CreateGroupModal from '@/components/dashboard/CreateGroupModal';

interface GroupSectionProps {
    servers: Server[];
    displayOption: 'list' | 'grid';
}

const GroupSection = ({ servers, displayOption }: GroupSectionProps) => {
    const { data: groups, mutate: mutateGroups } = useSWR('server-groups', () => getServerGroups());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
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

    const handleRename = useCallback(
        async (groupId: number) => {
            if (editingName.trim()) {
                await updateServerGroup(groupId, { name: editingName.trim() });
                mutateGroups();
            }
            setEditingGroupId(null);
            setEditingName('');
        },
        [editingName, mutateGroups],
    );

    const handleDelete = useCallback(
        async (groupId: number) => {
            await deleteServerGroup(groupId);
            mutateGroups();
        },
        [mutateGroups],
    );

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
                    onClick={() => setShowCreateModal(true)}
                    className='flex items-center gap-1.5 px-3 py-1.5 bg-mocha-400 hover:bg-mocha-300 text-white rounded-lg text-xs font-medium transition-colors'
                >
                    <Plus className='size-3.5' />
                    New Group
                </button>
            </div>

            {groups.map((group) => (
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
                    <div className='flex items-center justify-between px-4 py-3 cursor-pointer select-none'>
                        <div
                            className='flex items-center gap-3 flex-1 min-w-0'
                            onClick={() => handleToggleCollapse(group.id, group.is_collapsed)}
                        >
                            {group.is_collapsed ? (
                                <FolderOpen className='size-5 text-zinc-400 shrink-0' />
                            ) : (
                                <FolderOpenFill className='size-5 text-zinc-400 shrink-0' />
                            )}
                            {editingGroupId === group.id ? (
                                <input
                                    type='text'
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => handleRename(group.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename(group.id);
                                        if (e.key === 'Escape') {
                                            setEditingGroupId(null);
                                            setEditingName('');
                                        }
                                    }}
                                    autoFocus
                                    className='bg-transparent border-b border-zinc-500 text-zinc-100 text-sm font-medium focus:outline-none w-full'
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className='text-sm font-medium text-zinc-200 truncate'>{group.name}</span>
                            )}
                            <span className='text-xs text-zinc-500'>
                                {serversByGroup[group.id]?.length ?? 0} server
                                {(serversByGroup[group.id]?.length ?? 0) !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className='flex items-center gap-1 ml-2'>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingGroupId(group.id);
                                    setEditingName(group.name);
                                }}
                                className='p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded'
                                title='Rename group'
                            >
                                <Pencil className='size-3.5' />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(group.id);
                                }}
                                className='p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded'
                                title='Delete group'
                            >
                                <TrashBin className='size-3.5' />
                            </button>
                        </div>
                    </div>

                    {!group.is_collapsed && serversByGroup[group.id] && serversByGroup[group.id].length > 0 && (
                        <div className='px-4 pb-3 space-y-2'>
                            {serversByGroup[group.id].map((server, index) => (
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
        </div>
    );
};

export default GroupSection;
