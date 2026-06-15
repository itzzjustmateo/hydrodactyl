// Provides necessary information for components to function properly
// million-ignore
const HydrodactylProvider = ({ children }) => {
    return (
        <div
            data-pyro-hydrodactylprovider=''
            data-pyro-hydrodactyl-version={import.meta.env.VITE_HYDRODACTYL_VERSION}
            data-pyro-hydrodactyl-build={import.meta.env.VITE_HYDRODACTYL_BUILD_NUMBER}
            data-pyro-commit-hash={import.meta.env.VITE_COMMIT_HASH}
            style={{
                display: 'contents',
            }}
        >
            {children}
        </div>
    );
};

export default HydrodactylProvider;
