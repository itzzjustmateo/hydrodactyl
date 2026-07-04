import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type OwnerFilterValue = 'owner' | 'shared' | 'all' | 'admin-all';

interface OwnerFilterDropdownProps {
    value: OwnerFilterValue;
    rootAdmin: boolean;
    onChange: (value: OwnerFilterValue) => void;
}

const LABELS: Record<OwnerFilterValue, string> = {
    owner: 'My Servers',
    shared: 'Shared Only',
    all: 'All',
    'admin-all': 'All (Admin)',
};

const OwnerFilterDropdown = ({ value, rootAdmin, onChange }: OwnerFilterDropdownProps) => {
    const items = useMemo(() => {
        const list: OwnerFilterValue[] = ['owner', 'shared', 'all'];
        if (rootAdmin) list.push('admin-all');
        return list;
    }, [rootAdmin]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size={'sm'} variant={'secondary'} className='px-1 pl-3 gap-1 rounded-full hover:cursor-pointer'>
                    <div className='flex flex-row items-center gap-1'>{LABELS[value]}</div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='flex flex-col gap-1 z-99999 hover:cursor-pointer' sideOffset={8}>
                {items.map((item) => (
                    <DropdownMenuItem
                        key={item}
                        onSelect={() => onChange(item)}
                        className={value === item ? 'bg-accent/20' : ''}
                    >
                        {LABELS[item]}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onChange('all')} className='text-red-400'>
                    Reset
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default OwnerFilterDropdown;
