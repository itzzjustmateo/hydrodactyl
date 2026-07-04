import { ArrowDown01Icon, ArrowUp01Icon, Sorting01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SortOption {
    value: string;
    label: string;
}

interface SortDropdownProps {
    options: SortOption[];
    value?: string;
    direction?: 'asc' | 'desc';
    onSortChange: (value: string, direction: 'asc' | 'desc') => void;
}

const SortDropdown = ({ options, value, direction, onSortChange }: SortDropdownProps) => {
    const currentOption = useMemo(() => options.find((o) => o.value === value), [options, value]);

    const handleSelect = (selectedValue: string) => {
        if (value === selectedValue) {
            onSortChange(selectedValue, direction === 'asc' ? 'desc' : 'asc');
        } else {
            onSortChange(selectedValue, 'asc');
        }
    };

    const currentLabel = currentOption ? `${currentOption.label} (${direction === 'desc' ? 'Z→A' : 'A→Z'})` : 'Sort';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size={'sm'} variant={'secondary'} className='px-1 pl-3 gap-1 rounded-full hover:cursor-pointer'>
                    <div className='flex flex-row items-center gap-1'>
                        <div className='flex flex-row items-center gap-1.5'>
                            <HugeiconsIcon size={16} strokeWidth={2} icon={Sorting01Icon} className='size-4' />
                            {currentLabel}
                        </div>
                        <HugeiconsIcon
                            size={16}
                            strokeWidth={2}
                            icon={direction === 'desc' ? ArrowUp01Icon : ArrowDown01Icon}
                        />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='flex flex-col gap-1 z-99999 hover:cursor-pointer' sideOffset={8}>
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onSelect={() => handleSelect(option.value)}
                        className={value === option.value ? 'bg-accent/20' : ''}
                    >
                        <span className='flex items-center justify-between w-full gap-4'>
                            {option.label}
                            {value === option.value && (
                                <span className='text-xs opacity-60'>{direction === 'desc' ? 'Z→A' : 'A→Z'}</span>
                            )}
                        </span>
                    </DropdownMenuItem>
                ))}
                {value && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onSortChange('', 'asc')} className='text-red-400'>
                            Clear Sort
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortDropdown;
