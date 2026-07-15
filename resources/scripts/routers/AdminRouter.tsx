import {
    Activity02Icon,
    Archive01Icon,
    CubeIcon,
    Database02Icon,
    FolderIcon,
    GlobalIcon,
    NoteIcon,
    ServerStack02Icon,
    Settings02Icon,
    UserMultiple02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Fragment, Suspense, useMemo } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import AppHeader from '@/components/layout/header/AppHeader';
import MobileSidebar from '@/components/layout/sidebar/MobileSidebar';
import MainSidebar from '@/components/elements/MainSidebar';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

import AdminDashboardContainer from '@/components/admin/AdminDashboardContainer';
import AdminServersContainer from '@/components/admin/servers/AdminServersContainer';
import AdminNodesContainer from '@/components/admin/nodes/AdminNodesContainer';
import AdminUsersContainer from '@/components/admin/users/AdminUsersContainer';
import AdminLocationsContainer from '@/components/admin/locations/AdminLocationsContainer';
import AdminDatabasesContainer from '@/components/admin/databases/AdminDatabasesContainer';
import AdminNestsContainer from '@/components/admin/nests/AdminNestsContainer';
import AdminBucketsContainer from '@/components/admin/buckets/AdminBucketsContainer';
import AdminSettingsContainer from '@/components/admin/settings/AdminSettingsContainer';
import AdminApiContainer from '@/components/admin/api/AdminApiContainer';
import AdminMountsContainer from '@/components/admin/mounts/AdminMountsContainer';

const AdminRouter = () => {
    const navItems = useMemo(
        () => [
            {
                to: '/admin',
                icon: Activity02Icon,
                text: 'Overview',
                tabName: 'overview',
                ref: { current: null },
                end: true,
            },
            {
                to: '/admin/settings',
                icon: Settings02Icon,
                text: 'Settings',
                tabName: 'settings',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/api',
                icon: NoteIcon,
                text: 'API',
                tabName: 'api',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/servers',
                icon: ServerStack02Icon,
                text: 'Servers',
                tabName: 'servers',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/nodes',
                icon: Activity02Icon,
                text: 'Nodes',
                tabName: 'nodes',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/users',
                icon: UserMultiple02Icon,
                text: 'Users',
                tabName: 'users',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/locations',
                icon: GlobalIcon,
                text: 'Locations',
                tabName: 'locations',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/databases',
                icon: Database02Icon,
                text: 'Databases',
                tabName: 'databases',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/nests',
                icon: CubeIcon,
                text: 'Nests',
                tabName: 'nests',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/mounts',
                icon: FolderIcon,
                text: 'Mounts',
                tabName: 'mounts',
                ref: { current: null },
                end: false,
            },
            {
                to: '/admin/buckets',
                icon: Archive01Icon,
                text: 'S3 Buckets',
                tabName: 'buckets',
                ref: { current: null },
                end: false,
            },
        ],
        [],
    );

    return (
        <SidebarProvider>
            <HeaderProvider>
                <Fragment>
                    <div className='flex flex-col w-full h-full relative'>
                        <AppHeader />

                        <div className='flex flex-col lg:flex-row h-full w-full overflow-hidden relative'>
                            <MainSidebar className='hidden lg:flex lg:relative lg:shrink-0 w-[300px] bg-[#1a1a1a] flex flex-col h-full'>
                                <div className='flex flex-row items-center justify-between h-8 mb-4'>
                                    <span className='text-cream-400 font-semibold text-sm'>Admin Panel</span>
                                </div>
                                <div aria-hidden className='mb-4 bg-[#ffffff33] min-h-[1px] w-6'></div>
                                <nav className='flex-grow overflow-y-auto'>
                                    {navItems.map((item) => (
                                        <NavLink
                                            key={item.tabName}
                                            to={item.to}
                                            end={item.end}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive
                                                        ? 'bg-mocha-400/20 text-cream-400'
                                                        : 'text-mocha-200 hover:text-mocha-100 hover:bg-mocha-400/10'
                                                }`
                                            }
                                        >
                                            <HugeiconsIcon icon={item.icon} className='w-5 h-5 shrink-0' />
                                            <span>{item.text}</span>
                                        </NavLink>
                                    ))}
                                </nav>
                            </MainSidebar>
                            <MobileSidebar navItems={navItems} />

                            <PageContentBlock title={'Admin'} className='!bg-[#11100E] !border-0 !rounded-none'>
                                <Suspense
                                    fallback={
                                        <div className='flex items-center justify-center h-full'>
                                            <Spinner />
                                        </div>
                                    }
                                >
                                    <Routes>
                                        <Route path='' element={<AdminDashboardContainer />} />
                                        <Route path='settings/*' element={<AdminSettingsContainer />} />
                                        <Route path='api/*' element={<AdminApiContainer />} />
                                        <Route path='servers/*' element={<AdminServersContainer />} />
                                        <Route path='nodes/*' element={<AdminNodesContainer />} />
                                        <Route path='users/*' element={<AdminUsersContainer />} />
                                        <Route path='locations/*' element={<AdminLocationsContainer />} />
                                        <Route path='databases/*' element={<AdminDatabasesContainer />} />
                                        <Route path='nests/*' element={<AdminNestsContainer />} />
                                        <Route path='mounts/*' element={<AdminMountsContainer />} />
                                        <Route path='buckets/*' element={<AdminBucketsContainer />} />
                                    </Routes>
                                </Suspense>
                            </PageContentBlock>
                        </div>
                    </div>
                </Fragment>
            </HeaderProvider>
        </SidebarProvider>
    );
};

export default AdminRouter;
