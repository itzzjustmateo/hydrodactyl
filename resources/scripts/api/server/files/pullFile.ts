import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

interface PullFileParams {
    url: string;
    directory: string;
    filename?: string;
    /**
     * When true (default) the daemon downloads the file before responding, so a
     * successful response means the file is already on disk.
     */
    foreground?: boolean;
}

/**
 * Ask the daemon to download a remote file directly into the server's
 * container. Used by the installer to drop mods/plugins into the correct folder
 * (server-to-server, no browser bandwidth) once a direct URL has been resolved.
 */
export default (uuid: string, { url, directory, filename, foreground = true }: PullFileParams): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/pull`, {
            url,
            directory,
            filename: filename ?? null,
            use_header: true,
            foreground,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
